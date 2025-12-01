# Deployment Guide

This guide outlines the steps to deploy the Personal Voice Bot.

## Prerequisites

- GitHub Account
- Render Account (for Backend)
- Vercel Account (for Frontend)
- `git` installed locally

## 1. Push Code to GitHub

1.  Create a new repository on GitHub (e.g., `personal-voice-bot`).
2.  Push your local code to the repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/personal-voice-bot.git
git branch -M main
git push -u origin main
```

## 2. Deploy Backend to Render

1.  Log in to [Render](https://render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Select the **backend** directory as the **Root Directory**.
5.  Render should automatically detect the configuration from `render.yaml`.
    - **Runtime**: Python 3
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `python server.py`
6.  Add Environment Variables:
    - `OPENAI_API_KEY`: Your OpenAI API Key
    - `CARTESIA_API_KEY`: Your Cartesia API Key
    - `DEEPGRAM_API_KEY`: Your Deepgram API Key
    - `PORT`: `7860` (Render sets this automatically, but good to verify)
7.  Click **Create Web Service**.

## 3. Deploy Frontend to Vercel

1.  Log in to [Vercel](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    - **Framework Preset**: Vite
    - **Root Directory**: `frontend` (Click Edit and select `frontend`)
5.  Add Environment Variables:
    - `VITE_API_URL`: The URL of your deployed Render backend (e.g., `https://your-app-name.onrender.com`)
6.  Click **Deploy**.

## 4. Final Verification

1.  Open your Vercel deployment URL.
2.  Click "Start Conversation".
3.  Verify that the frontend connects to the backend and the voice bot works.
