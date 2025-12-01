# Voice Bot

Build a production-ready AI voice bot using the **official Pipecat quickstart pattern**. No Daily.co needed!

## 🎯 Features

- **Official Pipecat Pattern**: Follows docs.pipecat.ai quickstart
- **Built-in WebRTC**: No external services required
- **Real-time Voice**: Deepgram STT → OpenAI LLM → Cartesia TTS
- **Auto Greeting**: Bot speaks first when you connect
- **Beautiful UI**: Dark-themed launcher interface
- **Free Tier**: All services have free tiers

## 📋 Tech Stack

**Backend:**

- Pipecat - Voice AI framework
- Deepgram - Speech-to-Text
- OpenAI - Language Model (GPT-4o-mini)
- Cartesia - Text-to-Speech
- Built-in WebRTC server (port 7860)

**Frontend:**

- React + TypeScript + Vite
- shadcn/ui - Beautiful components
- Tailwind CSS v4

## 🚀 Quick Start

### Prerequisites

1. **Python 3.10+** installed
2. **API Keys** (all have free tiers):
   - **Deepgram** - https://console.deepgram.com/ (free $200 credit)
   - **OpenAI** - https://platform.openai.com/api-keys
   - **Cartesia** - https://cartesia.ai/ (free tier)

### Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Configure API keys
cp .env.example .env
# Edit .env and add your keys:
# - DEEPGRAM_API_KEY
# - OPENAI_API_KEY
# - CARTESIA_API_KEY

# Run the server
uv run python server.py
```

Backend WebRTC server runs on: **http://localhost:7860**

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on: **http://localhost:5173**

## 🎭 Customize the Persona

Edit the system message in `backend/bot.py`:

```python
messages = [
    {
        "role": "system",
        "content": """Your custom persona here...""",
    },
]
```

## 🧪 Testing

### Option 1: Direct WebRTC UI

1. Run backend: `uv run python server.py`
2. Open http://localhost:7860 in browser (returns connection details)
3. Use the frontend to connect

### Option 2: Via Frontend Launcher

1. Run backend: `uv run python server.py`
2. Run frontend: `npm run dev`
3. Open http://localhost:5173
4. Click "Connect" button (opens WebRTC UI in new window)
5. Allow microphone and start speaking!

**The bot will greet you first:** "Hello! I'm your AI voice assistant..."

## 📂 Project Structure

```
new_personal_voice_bot/
├── backend/
│   ├── bot.py              # Main Pipecat bot (official pattern)
│   ├── requirements.txt    # Just Pipecat with plugins
│   ├── .env                # API keys
│   └── Dockerfile          # For deployment
├── frontend/
│   ├── src/
│   │   └── App.tsx         # Launcher UI
│   └── package.json
└── README.md
```

## 🔄 How It Works

When you speak:

1. **Audio Capture** → Browser microphone via WebRTC
2. **VAD** → Silero detects speech
3. **STT** → Deepgram transcribes to text
4. **LLM** → OpenAI generates response
5. **TTS** → Cartesia synthesizes speech
6. **Playback** → Audio streams back to browser

Total latency: **< 1 second**

## 🚢 Deployment

### Deploy to Pipecat Cloud

The official Pipecat pattern is deployment-ready:

```bash
# Install pipecat CLI (already included)
pip install pipecat-ai

# Login to Pipecat Cloud
pipecat cloud auth login

# Configure secrets
pipecat cloud secrets set quickstart-secrets --file .env

# Build and push Docker image
pipecat cloud docker build-push

# Deploy
pipecat cloud deploy
```

See https://docs.pipecat.ai/deployment for full deployment guide.

## 📝 Environment Variables

```env
# Required API Keys
DEEPGRAM_API_KEY=        # From console.deepgram.com
OPENAI_API_KEY=          # From platform.openai.com
CARTESIA_API_KEY=        # From cartesia.ai
```

## 🛠️ Troubleshooting

**Bot won't start:**

- Check Python 3.10+ is installed
- Verify all API keys are set in `.env`
- Make sure port 7860 is free

**No audio:**

- Allow microphone permissions
- Check system audio settings
- Try different browser (Chrome/Firefox work best)

**WebRTC connection fails:**

- Disable VPN
- Check firewall settings
- Try incognito/private mode

## ✨ Why This Pattern?

**Advantages over Daily.co/LiveKit:**

1. **Simpler Setup** - No external services
2. **Official Pattern** - Follows Pipecat docs
3. **Deployment Ready** - Works with Pipecat Cloud
4. **Free Tier** - All services have free tiers
5. **Better Docs** - Official Pipecat documentation

## 📚 Resources

- [Pipecat Docs](https://docs.pipecat.ai/)
- [Quickstart Guide](https://docs.pipecat.ai/quickstart)
- [GitHub](https://github.com/pipecat-ai/pipecat)
- [Discord](https://discord.gg/pipecat)

## 📄 License

MIT License - Free for personal and commercial use

---

**Built with the official Pipecat quickstart pattern** 🚀

_Simple. Fast. Production-Ready._
