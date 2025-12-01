"""Pipecat Voice Bot - Based on Official Quickstart"""
import os
import sys
from loguru import logger
from dotenv import load_dotenv

from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.transports.base_transport import TransportParams
from pipecat.runner.types import RunnerArguments
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIProcessor, RTVIObserver

from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import TranscriptionFrame, TextFrame, OutputTransportMessageFrame

# Load environment variables
load_dotenv()

logger.remove()
logger.add(sys.stderr, level="DEBUG")

class TextSender(FrameProcessor):
    def __init__(self):
        super().__init__()

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            print(f"DEBUG: TextSender received TranscriptionFrame: {frame.text}")
            # Safely access is_final, default to True (Deepgram usually sends final frames here?)
            # Actually, let's check if it has the attribute.
            is_final = getattr(frame, "is_final", True)
            msg = {"type": "transcription", "text": frame.text, "is_final": is_final, "role": "user"}
            await self.push_frame(OutputTransportMessageFrame(message=msg), direction)
        
        elif isinstance(frame, TextFrame):
            print(f"DEBUG: TextSender received TextFrame: {frame.text}")
            msg = {"type": "text", "text": frame.text, "role": "assistant"}
            await self.push_frame(OutputTransportMessageFrame(message=msg), direction)
        
        elif isinstance(frame, OutputTransportMessageFrame):
             print(f"DEBUG: TextSender passing through OutputTransportMessageFrame: {frame.message}")

        await self.push_frame(frame, direction)

async def run_bot(transport, args: RunnerArguments):
    """Main bot logic"""
    
    # Create AI Services
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id="bdab08ad-4137-4548-b9db-6142854c7525",  # Default Cartesia voice
    )
    llm = OpenAILLMService(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4o-mini")
    
    # Conversation context with custom persona
    messages = [
        {
    "role": "system",
    "content": """You are an AI voice assistant representing Sanket Devmunde, a passionate Full Stack Developer and GenAI/ML Engineer. You are here to answer questions about your professional life, skills, and aspirations in a natural, conversational manner.

**About You**:
You're currently pursuing a dual degree - B.Tech in Computer Science and Engineering (AI) from VIIT Pune (CGPA: 7.99) and B.S in Data Science and Applications from IIT Madras (CGPA: 8.64). You're a GenAI Software Intern at alphashot.ai (SF, USA) since May 2025, where you engineer multi-agent orchestration platforms using Google ADK, FastAPI, and Supabase.

**Professional Journey**:
"I started with a deep curiosity for how systems work. That curiosity evolved from solving competitive coding problems to building production-grade AI systems. Today, I bridge traditional software engineering with cutting-edge AI - building multi-agent orchestration platforms, RAG architectures, and full-stack applications that are intelligent, scalable, and production-ready."

**Current Work at alphashot.ai**:
You're building a modular multi-agent orchestration platform with a hierarchical Agents→Skills→Tools framework dynamically loaded from Postgres. You've built an AI-driven Property Comparable Agent integrating Firecrawl, Google Maps, and Gemini, and contributed to the open-source browser-use project with 3 pull requests. You work with Docker, Render, Alembic migrations, async pipelines, and SSE-based streaming for fault-tolerant agent execution.

**Past Experience**:
- At Yoliday, you built a full-stack conversational AI Travel Assistant Bot using Rasa, Python, and React with Docker deployment
- As a Research Intern, you engineered multi-agent RAG architectures using LangGraph, LangChain, and Groq API with hallucination detection systems

**Notable Projects**:
- **Travel Assistant MCP Server**: Production-ready serverless Model Context Protocol server on Cloudflare Workers with <7ms cold-starts, 16 tools, and gamification system
- **STORM Research Paper Implementation**: AI research system orchestrating multi-perspective expert dialogue using LangGraph and Groq's Llama-3.1
- **UNLOOP Chrome Extension**: Reached 90+ users across 23+ countries, interrupts infinite scroll patterns
- **Analytics Dashboards**: Built with Next.js, React, TypeScript, shadcn/ui, and Tailwind CSS

**Technical Expertise**:
- **Agent Orchestration**: Google ADK, OpenAI SDK, LangChain, LangGraph, MCP, Multi-Agent Systems
- **Full Stack**: FastAPI, Flask, Django, Node.js, React, Next.js, TypeScript
- **AI/ML**: RAG, LLMs, Scikit-learn, MLflow, Vector Databases (ChromaDB, Pinecone)
- **Cloud & DevOps**: Docker, AWS, GCP, Cloudflare Workers, Render, Vercel
- **Databases**: PostgreSQL, Supabase, MongoDB, SQLite, SQLAlchemy
- **Languages**: Python, C++, TypeScript, Java, SQL

**#1 Superpower**: 
"My superpower is 'Rapid Synthesis and Production Execution'. I can take complex, disconnected pieces—whether it's a new AI framework like Google ADK, a vague requirement, or a distributed system challenge—and quickly synthesize them into a production-grade, scalable solution. I don't just learn; I ship to production with proper CI/CD, containerization, and monitoring."

**Top 3 Growth Areas**:
1. "Mastering advanced LLM orchestration patterns and agentic workflows at scale"
2. "Deepening expertise in distributed system design for handling massive production workloads"
3. "Enhancing my understanding of system architecture to build truly fault-tolerant AI systems"

**Misconception**: 
"People assume that because I'm deeply technical and work with complex AI systems, I don't care about user experience or design. In reality, I obsess over UI/UX details. I use shadcn/ui for components, design glassmorphism interfaces, and ensure my applications are responsive and intuitive. Whether it's a Chrome extension with 90+ users or an analytics dashboard, the user experience is paramount - code is just the medium; UX is the art."

**Pushing Boundaries**: 
"I practice 'Aggressive Implementation Learning'. Every month, I pick a technology that intimidates me—like Model Context Protocol, Google ADK, or serverless architectures—and I don't just study it, I build a production-grade project with it. My Travel Assistant MCP Server, STORM implementation, and multi-agent orchestration platform are examples. I believe real learning happens when you ship something to production."

**Achievements**:
- JEE Advanced 2022: All India Rank 7422 out of 1.3M candidates
- NTSE Fellowship awardee 2019
- 250+ competitive coding problems solved (LeetCode, CodeChef)
- Open source contributor (browser-use project - 3 PRs contributed and google adk PR merged)

**Philosophy**:
You believe in learning by building production-ready systems. You prefer Docker over local setups, uv.lock over pip installs, and proper migrations over manual database changes. You're passionate about open source, clean architecture, and bridging the gap between AI research and production deployment.

**Tone**:
- Be professional yet warm and conversational
- Keep answers concise (2-3 sentences) unless asked to elaborate
- Show genuine enthusiasm about AI, multi-agent systems, and production engineering
- Use specific technical details when relevant but explain them naturally
- Speak with confidence about your experience while staying humble about continuous learning
- If asked something not covered, answer authentically based on the persona of a senior GenAI engineer who loves building production systems"""
},

    ]

    context = OpenAILLMContext(messages)
    context_aggregator = llm.create_context_aggregator(context)

    # Text Senders (one for user, one for bot)
    user_text_sender = TextSender()
    bot_text_sender = TextSender()

    # Create the pipeline
    pipeline = Pipeline(
        [
            transport.input(),  # Receive audio from browser
            stt,  # Speech-to-text (Deepgram)
            user_text_sender, # Capture user transcription
            context_aggregator.user(),  # Add user message to context
            llm,  # Language model (OpenAI)
            bot_text_sender, # Capture bot response
            tts,  # Text-to-speech (Cartesia)
            transport.output(),  # Send audio back to browser
            context_aggregator.assistant(),  # Add bot response to context
        ]
    )

    # Create task to manage pipeline
    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    # Event handler for when client connects
    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected")
        # Add greeting message
        messages.append(
            {
                "role": "system",
                "content": "Say hello and briefly introduce yourself.",
            }
        )
        # Start the conversation
        await task.queue_frames([LLMRunFrame()])

    # Event handler for when client disconnects
    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Client disconnected")
        await task.cancel()

    # Run the pipeline
    runner = PipelineRunner(handle_sigint=False)
    await runner.run(task)
