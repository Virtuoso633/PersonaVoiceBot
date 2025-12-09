import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from aiortc.sdp import candidate_from_sdp
from aiortc import RTCIceServer
from pipecat.transports.smallwebrtc.request_handler import SmallWebRTCRequest
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from bot import run_bot
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport, SmallWebRTCCallbacks
from pipecat.transports.base_transport import TransportParams
import json
import logging
from pipecat.runner.types import RunnerArguments
from pydantic import BaseModel
from auth import supabase, get_current_user

# --- Logging Configuration ---
logger.remove()
logger.add(sys.stderr, level="DEBUG")
logging.basicConfig(level=logging.DEBUG) # Enable aiortc debug logs

# Suppress verbose HTTP client logs (httpx, httpcore, hpack)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("hpack").setLevel(logging.WARNING)

# --- Helpers ---
def get_ice_servers():
    """Get ICE servers from environment variable or default to Google STUN."""
    ice_servers_env = os.getenv("ICE_SERVERS")
    if ice_servers_env:
        try:
            return json.loads(ice_servers_env)
        except json.JSONDecodeError:
            logger.error("Failed to parse ICE_SERVERS environment variable")
            
    return [{"urls": "stun:stun.l.google.com:19302"}]

# --- Configuration ---
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 7860))

# --- State ---
# Store active connections by pc_id
active_connections = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    yield
    # Cleanup
    for conn in active_connections.values():
        await conn._close()
    active_connections.clear()

app = FastAPI(lifespan=lifespan)

# --- CORS ---
# Get frontend URL from environment (for production deployment)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Allow both localhost (dev) and production frontend
allowed_origins = [
    "http://localhost:5173",  # Development
    FRONTEND_URL,  # Production (set in Render environment variables)
]

# Remove duplicates
allowed_origins = list(set(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---

# Auth Models
class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/auth/signup")
async def signup(request: SignupRequest):
    """Register a new user."""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Authentication service not configured")
        
        # Sign up user with Supabase
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "full_name": request.full_name
                }
            }
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Signup failed")
        
        return {
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": request.full_name
            },
            "session": {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token
            }
        }
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(request: LoginRequest):
    """Login an existing user."""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Authentication service not configured")
        
        # Sign in user with Supabase
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name", "")
            },
            "session": {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token
            }
        }
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user."""
    return {"user": current_user}

@app.post("/auth/check-email")
async def check_email(request: Request):
    """Check if an email exists in the database."""
    try:
        data = await request.json()
        email = data.get("email")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        if not supabase:
            raise HTTPException(status_code=500, detail="Authentication service not configured")
        
        # Use admin API with pagination to check if email exists
        # This is more efficient than fetching all users without pagination
        try:
            response = supabase.auth.admin.list_users(page=1, per_page=1000)
            users = response if isinstance(response, list) else []
            email_exists = any(user.email == email for user in users)
            return {"exists": email_exists}
        except Exception as e:
            logger.error(f"Error checking email: {e}")
            return {"exists": False}
            
    except Exception as e:
        logger.error(f"Check email error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def get_connection_details():
    """Return connection details for the frontend."""
    return {
        "transport": "webrtc", 
        "url": f"http://localhost:{PORT}",
        "ice_servers": get_ice_servers()
    }

@app.post("/offer")
async def offer_endpoint(request: SmallWebRTCRequest, current_user: dict = Depends(get_current_user)):
    """Handle WebRTC offer from client (protected)."""
    try:
        logger.info(f"WebRTC offer from user: {current_user['email']}")
        # 1. Create a new connection
        # Configure STUN/TURN servers
        ice_servers_config = get_ice_servers()
        rtc_ice_servers = [
            RTCIceServer(
                urls=server.get("urls"),
                username=server.get("username"),
                credential=server.get("credential")
            ) for server in ice_servers_config
        ]
        
        connection = SmallWebRTCConnection(
            ice_servers=rtc_ice_servers
        )
        
        # 2. Initialize with offer
        await connection.initialize(request.sdp, request.type)
        answer = connection.get_answer()
        
        if not answer:
            raise Exception("Failed to create answer")
            
        logger.debug(f"Generated Answer SDP: {answer['sdp']}")
            
        pc_id = answer["pc_id"]
        active_connections[pc_id] = connection
        logger.info(f"Created connection with pc_id: {pc_id}")
        logger.info(f"Active connections: {list(active_connections.keys())}")
        
        # 3. Start the bot
        # Create callbacks (empty for now as we don't handle app messages yet)
        async def on_app_message(message, sender):
            pass
        async def on_client_connected(conn):
            pass
        async def on_client_disconnected(conn):
            pass
            
        callbacks = SmallWebRTCCallbacks(
            on_app_message=on_app_message,
            on_client_connected=on_client_connected,
            on_client_disconnected=on_client_disconnected
        )
        
        # Create transport
        transport = SmallWebRTCTransport(
            webrtc_connection=connection,
            params=TransportParams(audio_out_enabled=True, video_out_enabled=False, audio_in_enabled=True)
        )
        
        # Extract user's first name for personalized greeting
        user_full_name = current_user.get("user_metadata", {}).get("full_name", "")
        user_first_name = user_full_name.split()[0] if user_full_name else None
        
        # Run bot in background with user's name
        runner_args = RunnerArguments()
        import asyncio
        asyncio.create_task(run_bot(transport, runner_args, user_name=user_first_name))
        
        # 4. Return answer
        return answer

    except Exception as e:
        logger.error(f"Offer failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/candidate")
async def candidate_endpoint(request: Request, current_user: dict = Depends(get_current_user)):
    """Handle ICE candidate from client."""
    try:
        data = await request.json()
        pc_id = data.get("pc_id")
        candidates = data.get("candidates", [])
        
        logger.info(f"Received candidate for pc_id: {pc_id}")
        logger.info(f"Active connections: {list(active_connections.keys())}")
        
        connection = active_connections.get(pc_id)
        
        if not connection:
            logger.warning(f"Connection not found for pc_id: {pc_id}")
            raise HTTPException(status_code=404, detail="Connection not found")
            
        for c in candidates:
            candidate_str = c.get("candidate")
            sdp_mid = c.get("sdp_mid")
            sdp_mline_index = c.get("sdp_mline_index")
            
            # Skip if candidate string is empty (end of candidates)
            if not candidate_str:
                continue
                
            # Skip if missing required fields for aiortc
            if sdp_mid is None and sdp_mline_index is None:
                logger.debug("Skipping candidate without sdpMid or sdpMLineIndex")
                continue
            
            try:
                # Convert to aiortc candidate
                candidate = candidate_from_sdp(candidate_str)
                candidate.sdpMid = sdp_mid
                candidate.sdpMLineIndex = sdp_mline_index
                await connection.add_ice_candidate(candidate)
            except Exception as e:
                logger.warning(f"Failed to add candidate: {e}")
                # Continue processing other candidates
            
        return {"status": "ok"}
        
        return {"status": "ok"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Candidate endpoint error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
