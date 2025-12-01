import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from aiortc.sdp import candidate_from_sdp
from pipecat.transports.smallwebrtc.request_handler import SmallWebRTCRequest
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from bot import run_bot
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport, SmallWebRTCCallbacks
from pipecat.transports.base_transport import TransportParams
from pipecat.runner.types import RunnerArguments

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---

@app.get("/")
async def get_connection_details():
    """Return connection details for the frontend."""
    return {"transport": "webrtc", "url": f"http://localhost:{PORT}"}

@app.post("/offer")
async def offer_endpoint(request: SmallWebRTCRequest):
    """Handle WebRTC offer from client."""
    try:
        # 1. Create a new connection
        # Configure STUN server for production
        connection = SmallWebRTCConnection(
            ice_servers=[{"urls": "stun:stun.l.google.com:19302"}]
        )
        
        # 2. Initialize with offer
        await connection.initialize(request.sdp, request.type)
        answer = connection.get_answer()
        
        if not answer:
            raise Exception("Failed to create answer")
            
        pc_id = answer["pc_id"]
        active_connections[pc_id] = connection
        
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
        
        # Run bot in background
        runner_args = RunnerArguments()
        import asyncio
        asyncio.create_task(run_bot(transport, runner_args))
        
        # 4. Return answer
        return answer

    except Exception as e:
        logger.error(f"Offer failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/candidate")
async def candidate_endpoint(request: Request):
    """Handle ICE candidate from client."""
    try:
        data = await request.json()
        pc_id = data.get("pc_id")
        candidates = data.get("candidates", [])
        
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
