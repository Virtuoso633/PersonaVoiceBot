# Deployment Guide

This guide outlines the steps to deploy the Personal Voice Bot.

## Prerequisites

- GitHub Account
- Render Account (for Backend)
- Vercel Account (for Frontend)
- Supabase Account (for Auth/DB)
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
    - **Build Command**: `pip install uv && uv sync`
    - **Start Command**: `uv run uvicorn server:app --host 0.0.0.0 --port $PORT`
6.  Add Environment Variables:
    - `OPENAI_API_KEY`: Your OpenAI API Key
    - `CARTESIA_API_KEY`: Your Cartesia API Key
    - `DEEPGRAM_API_KEY`: Your Deepgram API Key
    - `SUPABASE_URL`: Your Supabase Project URL
    - `SUPABASE_SERVICE_KEY`: Your Supabase Service Role Key (Settings -> API -> Service Role)
    - `ICE_SERVERS`: JSON string of your TURN server configuration. Example:
      ```json
      [
        { "urls": "stun:stun.relay.metered.ca:80" },
        {
          "urls": "turn:global.relay.metered.ca:80",
          "username": "your_username",
          "credential": "your_password"
        },
        {
          "urls": "turn:global.relay.metered.ca:80?transport=tcp",
          "username": "your_username",
          "credential": "your_password"
        },
        {
          "urls": "turn:global.relay.metered.ca:443",
          "username": "your_username",
          "credential": "your_password"
        },
        {
          "urls": "turns:global.relay.metered.ca:443?transport=tcp",
          "username": "your_username",
          "credential": "your_password"
        }
      ]
      ```
    - `PORT`: `7860` (Render sets this automatically, but good to verify)
7.  Click **Create Web Service**.
8.  After deployment, note your Render backend URL (e.g., `https://your-app-name.onrender.com`).

## 3. Configure Authentication (Supabase)

### 3.1 Add Redirect URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add these redirect URLs (replace `YOUR-VERCEL-APP` with your actual Vercel domain):

```
http://localhost:5173/**
http://localhost:5173/reset-password
https://YOUR-VERCEL-APP.vercel.app/**
https://YOUR-VERCEL-APP.vercel.app/reset-password
```

**⚠️ Critical:** Without these URLs, password reset and email confirmation will fail!

### 3.2 Set Site URL

- **Development:** `http://localhost:5173`
- **Production:** `https://YOUR-VERCEL-APP.vercel.app`

Configure in: **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Site URL**

### 3.3 Verify Email Templates

1. Go to **Authentication** → **Email Templates**

2. **Confirm Signup Template:**

   - Should use `{{ .ConfirmationURL }}`
   - Example:
     ```html
     <h2>Confirm your signup</h2>
     <p>Follow this link to confirm your account:</p>
     <p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
     ```

3. **Reset Password Template:**
   - ✅ **Correct format:**
     ```html
     <h2>Reset Password</h2>
     <p>Follow this link to reset the password for your user:</p>
     <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
     ```
   - ❌ **Wrong format** (will cause "link expired" errors):
     ```html
     <a href="{{ .SiteURL }}/reset-password?token={{ .Token }}"
       >Reset Password</a
     >
     ```

**Why:** `{{ .ConfirmationURL }}` generates the proper magic link with `#access_token=...&type=recovery` in the URL hash.

### 3.4 Test Email Sending

Before going to production, test in development:

1. Signup with a real email
2. Verify confirmation email arrives
3. Click confirmation link → Should redirect to `http://localhost:5173`
4. Test password reset flow

## 4. Deploy Frontend to Vercel

1.  Log in to [Vercel](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    - **Framework Preset**: Vite
    - **Root Directory**: `frontend` (Click Edit and select `frontend`)
5.  Add Environment Variables:
    - `VITE_API_URL`: The URL of your deployed Render backend (e.g., `https://your-app-name.onrender.com`)
    - `VITE_SUPABASE_URL`: Your Supabase Project URL
    - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
6.  Click **Deploy**.
7.  After deployment, note your Vercel URL (e.g., `https://your-app-name.vercel.app`).

## 5. Update Backend CORS for Production

After deploying frontend, update backend to allow production domain:

1. Go to your Render dashboard
2. Open your web service
3. Add this environment variable:
   - **Key:** `FRONTEND_URL`
   - **Value:** `https://YOUR-VERCEL-APP.vercel.app`
4. The backend CORS is configured to use this variable

Alternatively, you can update `backend/server.py` directly:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Development
        "https://YOUR-VERCEL-APP.vercel.app",  # Production - UPDATE THIS
    ],
    # ...
)
```

## 6. Final Verification

### 6.1 Basic Connectivity Test

1. Open your Vercel deployment URL
2. Click "Start Conversation"
3. Verify that the frontend connects to the backend and the voice bot works

### 6.2 Authentication Flow Tests

**✅ Signup Flow:**

1. Navigate to `https://YOUR-APP.vercel.app/signup`
2. Create account with real email
3. Check inbox for confirmation email
4. Click confirmation link → Should redirect to production URL
5. Login with credentials
6. Verify animated greeting appears with your name

**✅ Login Flow:**

1. Navigate to `/login`
2. Test wrong password → Should show "Incorrect password" with action button
3. Test non-existent email → Should show "Please sign up" with action button
4. Login successfully → Should see animated greeting

**✅ Password Reset Flow:**

1. Navigate to `/forgot-password`
2. Enter registered email
3. Check inbox for reset email
4. Click reset link → Should redirect to production `/reset-password`
5. Enter new password
6. Should redirect to login after 1.5 seconds
7. Login with new password

**✅ Protected Routes:**

1. Logout from application
2. Try to access `/` → Should auto-redirect to `/login`
3. Login → Should redirect back to home page

**✅ Session Persistence:**

1. Login to production
2. Refresh page → Should stay logged in
3. Close browser and reopen → Should still be logged in

**✅ Personalized Bot Greeting:**

1. Login to frontend
2. Start voice conversation
3. Bot should say: "Hey [YourName]! I am a Voice Assistant on behalf of..."

### 6.3 Check Browser Console

- Open Developer Tools → Console
- Should have NO CORS errors
- Should have NO authentication errors

---

## Troubleshooting

### Problem: "Invalid or expired reset link"

**Solutions:**

1. Verify Supabase email template uses `{{ .ConfirmationURL }}`
2. Check redirect URLs are whitelisted in Supabase
3. Ensure production URL is in the redirect list

### Problem: CORS errors in production

**Solution:** Verify `FRONTEND_URL` environment variable in Render or update CORS origins in `server.py`

### Problem: Users logged out on refresh

**Solution:** Check that `persistSession: true` is set in `frontend/src/lib/supabase.ts`

### Problem: Emails not sending

**Solutions:**

1. Check Supabase email settings
2. Verify SMTP configuration (if using custom domain)
3. Check spam folder
4. For development: Use Supabase Inbucket to view test emails
