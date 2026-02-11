# Complete Authentication System Documentation

This document provides a comprehensive guide to implementing a full-featured authentication system using **Supabase**, **React**, **TypeScript**, and **Zustand**. Use this as a reference template for future projects.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [File Structure](#file-structure)
4. [Implementation Steps](#implementation-steps)
5. [Supabase Configuration](#supabase-configuration)
6. [Edge Cases & Fixes](#edge-cases--fixes)
7. [Code Examples](#code-examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This authentication system includes:

- ✅ User signup with email confirmation
- ✅ Login with session persistence
- ✅ Password reset flow with secure tokens
- ✅ Protected routes
- ✅ User profile management
- ✅ Toast notifications for user feedback
- ✅ Responsive, modern UI with consistent styling
- ✅ Email enumeration prevention
- ✅ Password validation

---

## Tech Stack

| Technology       | Purpose                                      |
| ---------------- | -------------------------------------------- |
| **Supabase**     | Authentication backend + PostgreSQL database |
| **React**        | Frontend framework                           |
| **TypeScript**   | Type safety                                  |
| **Zustand**      | State management                             |
| **React Router** | Client-side routing                          |
| **Sonner**       | Toast notifications                          |
| **Lucide React** | Icons                                        |
| **Tailwind CSS** | Styling                                      |

---

## File Structure

```
frontend/src/
├── components/
│   └── auth/
│       ├── LoginPage.tsx            # Login form
│       ├── SignupPage.tsx           # Registration form
│       ├── ForgotPasswordPage.tsx   # Request password reset
│       ├── ResetPasswordPage.tsx    # Set new password
│       └── ProtectedRoute.tsx       # Route guard component
├── store/
│   └── authStore.ts                 # Zustand auth state management
├── lib/
│   ├── supabase.ts                  # Supabase client configuration
│   └── utils.ts                     # Utility functions (cn helper)
└── App.tsx                          # Route configuration

backend/ (optional)
├── auth.py                          # FastAPI auth utilities
└── server.py                        # API endpoints (e.g., /auth/check-email)
```

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js zustand react-router-dom sonner lucide-react
npm install -D @types/node
```

### Step 2: Set Up Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:7860  # Optional backend
```

### Step 3: Configure Supabase Client

**File: `src/lib/supabase.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true, // CRITICAL: Detects session from URL hash
    persistSession: true, // Persist session in localStorage
    autoRefreshToken: true, // Auto-refresh tokens
  },
});
```

**Key Configuration:**

- `detectSessionInUrl: true` - Essential for password reset and email confirmation flows
- `persistSession: true` - Keeps users logged in across sessions
- `autoRefreshToken: true` - Automatically refreshes access tokens

### Step 4: Create Auth Store

**File: `src/store/authStore.ts`**

```typescript
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;

  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<{ error: any | null }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  signUp: async (email, password, fullName) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      set({ user: data.user, session: data.session, loading: false });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ user: data.user, session: data.session, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, session: null, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ user: session?.user ?? null, session, loading: false });
    } catch (error) {
      set({ user: null, session: null, loading: false });
    }
  },

  checkEmailExists: async (email: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7860";
      const response = await fetch(`${API_URL}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return data.exists ? { error: null } : { error: "not_found" };
    } catch (error) {
      return { error };
    }
  },
}));
```

### Step 5: Create Authentication Pages

See [Code Examples](#code-examples) section below for complete page implementations.

### Step 6: Set Up Protected Routes

**File: `src/components/auth/ProtectedRoute.tsx`**

```typescript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : null;
}
```

### Step 7: Configure Routes

**File: `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "@/components/auth/LoginPage";
import { SignupPage } from "@/components/auth/SignupPage";
import { ForgotPasswordPage } from "@/components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Supabase Configuration

### 1. Authentication Settings

Navigate to: **Supabase Dashboard → Authentication → Settings**

#### Site URL

```
http://localhost:5173  # Development
https://yourdomain.com # Production
```

#### Redirect URLs

Add these URLs (one per line):

```
http://localhost:5173/**
http://localhost:5173/reset-password
https://yourdomain.com/**
https://yourdomain.com/reset-password
```

**⚠️ Critical:** Without these, password reset links will fail!

### 2. Email Templates

Navigate to: **Supabase Dashboard → Authentication → Email Templates**

#### Confirm Signup Template

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

#### Reset Password Template (IMPORTANT FIX)

**❌ Wrong (causes token validation issues):**

```html
<a href="{{ .SiteURL }}/reset-password?token={{ .Token }}">Reset Password</a>
```

**✅ Correct:**

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
```

**Why:** `{{ .ConfirmationURL }}` generates the proper magic link format with `#access_token=...&type=recovery&refresh_token=...` in the URL hash, which the frontend needs to set up the session.

### 3. Environment Variables Setup

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:7860

# Backend (.env) - if using FastAPI
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Service role key for admin operations
```

---

## Edge Cases & Fixes

### 1. Password Reset Token Validation

**Issue:** Reset link shows "Invalid or expired" error.

**Root Cause:**

- Email template using `?token=` query parameter instead of hash fragment
- Redirect URL not whitelisted in Supabase

**Solution:**

1. Update email template to use `{{ .ConfirmationURL }}`
2. Add redirect URLs to Supabase dashboard
3. Configure `detectSessionInUrl: true` in Supabase client

### 2. Email Enumeration Prevention

**Issue:** Attackers can determine if email exists by signup/login error messages.

**Solution in Signup:**

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: fullName } },
});

if (error) {
  if (error.message.includes("already registered")) {
    toast.error("Email already registered", {
      description: "Please login instead.",
      action: { label: "Go to Login", onClick: () => navigate("/login") },
    });
  }
}
```

**Solution in Forgot Password:**

```typescript
const checkResponse = await fetch(`${API_URL}/auth/check-email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});

const { exists } = await checkResponse.json();

if (!exists) {
  // Show generic message to prevent email enumeration
  toast.info(
    `If there's an account with ${email}, you will receive a reset link.`
  );
  return;
}
```

### 3. Email Confirmation Flow

**Issue:** Users see confusing errors when trying to login before confirming email.

**Solution:**

```typescript
try {
  await signIn(email, password);
} catch (error: any) {
  if (error.message.toLowerCase().includes("email not confirmed")) {
    toast.error(
      "Please confirm your email address before logging in. Check your inbox!",
      {
        duration: 6000,
      }
    );
  }
}
```

### 4. Password Validation

**Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Implementation:**

```typescript
const validatePassword = (pwd: string): string | null => {
  if (pwd.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(pwd))
    return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(pwd))
    return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
  return null;
};
```

### 5. Session Persistence

**Issue:** Users get logged out on page refresh.

**Solution:**

```typescript
// In App.tsx
const checkAuth = useAuthStore((state) => state.checkAuth);

useEffect(() => {
  checkAuth(); // Check for existing session on mount
}, [checkAuth]);

// In supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ← Key setting
    autoRefreshToken: true,
  },
});
```

### 6. Consistent UI Styling

**Color Scheme:**

```typescript
// Primary gradient: indigo → purple
"bg-gradient-to-r from-indigo-500 to-purple-500";
"hover:from-indigo-600 hover:to-purple-600";

// Focus rings
"focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500";

// Background blur
"bg-indigo-500/20 blur-[120px]";
```

---

## Code Examples

### LoginPage.tsx (Key Features)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setLoading(true);
  try {
    await signIn(email, password);
    toast.success("Welcome back!");
    navigate("/");
  } catch (error: any) {
    const errorMsg = error.message || "";

    if (errorMsg.toLowerCase().includes("email not confirmed")) {
      toast.error("Please confirm your email address before logging in.", {
        duration: 6000,
      });
    } else if (errorMsg.toLowerCase().includes("invalid login credentials")) {
      // Check if email exists
      const { error: resetError } = await checkEmailExists(email);

      if (resetError === null) {
        toast.error("Incorrect password. Please try again.", {
          action: {
            label: "Forgot password?",
            onClick: () => navigate("/forgot-password"),
          },
        });
      } else {
        toast.error("Account not found. Please sign up first!", {
          action: {
            label: "Sign up",
            onClick: () => navigate("/signup"),
          },
        });
      }
    }
  } finally {
    setLoading(false);
  }
};
```

### ForgotPasswordPage.tsx (Key Features)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setLoading(true);
  try {
    // Check if email exists first (prevent enumeration)
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7860";
    const checkResponse = await fetch(`${API_URL}/auth/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const checkData = await checkResponse.json();

    if (!checkData.exists) {
      // Show generic message
      toast.info(
        `If there's an account with ${email}, you will receive a reset link.`
      );
      setSent(true);
      return;
    }

    // Email exists, send reset link
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    setSent(true);
    toast.success("Password reset email sent!", {
      description: `Check your inbox at ${email} for the reset link.`,
    });
  } catch (error: any) {
    toast.error("Failed to send reset email");
  } finally {
    setLoading(false);
  }
};
```

### ResetPasswordPage.tsx (Key Features)

```typescript
useEffect(() => {
  const handleResetToken = async () => {
    try {
      // Get token from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      // Also check for query parameter (fallback for misconfigured email)
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get("token");

      if (type === "recovery" && accessToken) {
        // Set session with the token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (error) {
          toast.error("Invalid or expired reset link");
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } else if (queryToken) {
        // Show error about email template configuration
        toast.error("Incorrect reset link format", {
          description: "Your Supabase email template needs to be updated.",
          duration: 10000,
        });
        setTokenValid(false);
      } else {
        toast.error("Invalid reset link");
        setTokenValid(false);
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setTokenValid(false);
    } finally {
      setCheckingToken(false);
    }
  };

  handleResetToken();
}, [navigate]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const validationError = validatePassword(password);
  if (validationError) {
    toast.error(validationError);
    return;
  }

  if (password !== confirmPassword) {
    toast.error("Passwords do not match");
    return;
  }

  setLoading(true);
  try {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) throw error;

    toast.success("✓ Password updated successfully!", {
      description: "You can now sign in with your new password.",
    });

    setTimeout(() => navigate("/login"), 1500);
  } catch (error: any) {
    toast.error("Failed to reset password");
  } finally {
    setLoading(false);
  }
};
```

---

## Troubleshooting

### Problem: "Invalid or expired reset link"

**Checklist:**

1. ✅ Is `{{ .ConfirmationURL }}` used in email template?
2. ✅ Are redirect URLs whitelisted in Supabase dashboard?
3. ✅ Is `detectSessionInUrl: true` in supabase.ts?
4. ✅ Is the token in URL hash (`#access_token=...`) not query param (`?token=...`)?

### Problem: Users logged out on refresh

**Solution:**

- Check `persistSession: true` in supabase client
- Ensure `checkAuth()` is called in App.tsx useEffect

### Problem: Email not sending

**Checklist:**

1. Verify Supabase email settings
2. Check spam folder
3. For development: Use Supabase Inbucket (fake email server)
4. For production: Configure custom SMTP in Supabase

### Problem: CORS errors

**Solution:**

```typescript
// In FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Backend API (Optional)

### Check Email Endpoint

**File: `backend/server.py`**

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class EmailCheck(BaseModel):
    email: str

@app.post("/auth/check-email")
async def check_email(data: EmailCheck):
    try:
        # Use admin API to check if user exists
        response = supabase.auth.admin.list_users()
        users = response.users if hasattr(response, 'users') else []

        exists = any(user.email == data.email for user in users)
        return {"exists": exists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Checklist for New Projects

- [ ] Install dependencies
- [ ] Set up `.env` files
- [ ] Configure Supabase client with auth options
- [ ] Create auth store with Zustand
- [ ] Implement auth pages (Login, Signup, ForgotPassword, ResetPassword)
- [ ] Create ProtectedRoute component
- [ ] Configure routes in App.tsx
- [ ] **Supabase Dashboard:**
  - [ ] Set Site URL
  - [ ] Add Redirect URLs
  - [ ] Update Reset Password email template to use `{{ .ConfirmationURL }}`
  - [ ] Update Confirm Signup email template
  - [ ] Test email sending
- [ ] Implement password validation
- [ ] Add email existence checking (prevent enumeration)
- [ ] Setup animated greeting component
- [ ] Configure personalized backend greetings
- [ ] Test entire flow:
  - [ ] Signup → Email confirmation → Login
  - [ ] Forgot password → Reset password → Login
  - [ ] Protected routes redirect to login
  - [ ] Session persists on refresh
  - [ ] Animated greeting appears on successful login
  - [ ] Backend greets user by name when starting conversation

---

## Advanced Features

### 1. Enhanced Toast Notifications with Actionable Buttons

All toast notifications include actionable buttons that guide users to their next step.

#### Login Page Enhancements

```typescript
// Distinguish between wrong password and non-existent email
catch (error: any) {
  const errorMsg = error.message || "";

  if (errorMsg.toLowerCase().includes("email not confirmed")) {
    toast.error(
      "Please confirm your email address before logging in. Check your inbox!",
      { duration: 6000 }
    );
  } else if (errorMsg.toLowerCase().includes("invalid login credentials")) {
    // Check if email exists in database
    const { error: resetError } = await checkEmailExists(email);

    if (resetError === null) {
      // Email exists, so password is wrong
      toast.error("Incorrect password. Please try again.", {
        duration: 5000,
        action: {
          label: "Forgot password?",
          onClick: () => navigate("/forgot-password"),
        },
      });
    } else {
      // Email doesn't exist in database
      toast.error("Account not found. Please sign up first!", {
        duration: 5000,
        action: {
          label: "Sign up",
          onClick: () => navigate("/signup"),
        },
      });
    }
  }
}
```

#### Signup Page Enhancements

```typescript
// Success with email confirmation required
if (!result?.session) {
  toast.success(
    "🎉 Account created! Please check your email to confirm your account.",
    {
      description: email,
      duration: 6000,
    }
  );
  navigate("/login");
}

// Success with direct login (no confirmation needed)
else {
  toast.success("🎉 Welcome to Nexus AI!", {
    description: "Your account has been created successfully.",
  });
  navigate("/");
}

// Error: Email already registered
if (errorMsg.includes("already registered")) {
  toast.error("This email is already registered", {
    description: "Please sign in to your existing account.",
    action: {
      label: "Sign in",
      onClick: () => navigate("/login"),
    },
  });
}
```

#### Forgot Password Page Enhancements

```typescript
// Check if email exists first
const checkResponse = await fetch(`${API_URL}/auth/check-email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});

const checkData = await checkResponse.json();

if (!checkData.exists) {
  // Show generic message (prevent email enumeration)
  toast.info(
    `If there's an account registered with ${email}, you will receive your reset link.`,
    { duration: 6000 }
  );
  setSent(true);
  return;
}

// Email exists, send reset link
toast.success("Password reset email sent!", {
  duration: 8000,
  description: `Check your inbox at ${email} for the reset link.`,
});
```

#### Reset Password Page Enhancements

```typescript
// Success
toast.success("✓ Password updated successfully!", {
  duration: 5000,
  description: "You can now sign in with your new password.",
});

// Error: Password unchanged
if (errorMsg.toLowerCase().includes("same as old password")) {
  toast.error("Password unchanged", {
    description: "New password must be different from your old password.",
  });
}

// Error: Link expired
toast.error("Link expired", {
  description: "This reset link has expired. Please request a new one.",
  action: {
    label: "Request new link",
    onClick: () => navigate("/forgot-password"),
  },
});
```

### 2. Animated Welcome Greeting

Replace toast notifications with a custom animated rolling text greeting that appears in the bottom-left corner for 2 seconds.

#### Create Greeting Component

**File: `src/components/ui/animated-greeting.tsx`**

```typescript
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedGreetingProps {
  name: string;
  onComplete?: () => void;
}

export function AnimatedGreeting({ name, onComplete }: AnimatedGreetingProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in after a tiny delay
    const slideInTimer = setTimeout(() => setVisible(true), 100);

    // Slide out after 2 seconds
    const slideOutTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, 2100);

    return () => {
      clearTimeout(slideInTimer);
      clearTimeout(slideOutTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed bottom-8 left-8 z-50",
        "px-6 py-4 rounded-2xl",
        "bg-gradient-to-r from-indigo-500 to-purple-500",
        "text-white font-semibold text-lg",
        "shadow-2xl shadow-indigo-500/50",
        "transition-all duration-300 ease-out",
        "backdrop-blur-sm",
        visible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl animate-wave">�</span>
        <span>Hello, {name}!</span>
      </div>
    </div>
  );
}
```

#### Add Wave Animation to CSS

**File: `src/index.css`**

```css
@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  10%,
  30% {
    transform: rotate(14deg);
  }
  20%,
  40% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(14deg);
  }
  60% {
    transform: rotate(-4deg);
  }
  70% {
    transform: rotate(10deg);
  }
}

@layer utilities {
  .animate-wave {
    animation: wave 1.5s ease-in-out;
    transform-origin: 70% 70%;
    display: inline-block;
  }
}
```

#### Integrate Greeting in Home Page

**File: `src/App.tsx`** (inside Home component)

```typescript
const { session, user } = useAuthStore();
const [showGreeting, setShowGreeting] = useState(false);

// Show personalized greeting when user first arrives
useEffect(() => {
  if (user) {
    const timer = setTimeout(() => setShowGreeting(true), 500);
    return () => clearTimeout(timer);
  }
}, [user]);

// In JSX, at the end of the component
return (
  <div>
    {/* ... existing content ... */}

    {/* Animated Greeting */}
    {showGreeting && user && (
      <AnimatedGreeting
        name={user.user_metadata?.full_name?.split(" ")[0] || "there"}
        onComplete={() => setShowGreeting(false)}
      />
    )}
  </div>
);
```

### 3. Personalized Backend Greeting

Make the voice bot greet users by name when they start a conversation.

#### Update Backend Bot

**File: `backend/bot.py`**

```python
async def run_bot(transport, args: RunnerArguments, user_name: str = None):
    """Main bot logic with personalized greeting"""

    # ... existing setup ...

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected")

        # Add personalized greeting message with user's name
        if user_name:
            greeting_message = f"Greet the user warmly by saying: 'Hey {user_name}! I am a Voice Assistant on behalf of Sanket, and I am trained on his resume and professional data. So you can ask me anything about him.' Keep it natural and conversational."
        else:
            greeting_message = "Greet the user by saying: 'Hey there! I am a Voice Assistant on behalf of Sanket, and I am trained on his resume and professional data. So you can ask me anything about him.' Keep it natural and conversational."

        messages.append({
            "role": "system",
            "content": greeting_message,
        })

        await task.queue_frames([LLMRunFrame()])
```

#### Update Server to Pass User Name

**File: `backend/server.py`**

```python
@app.post("/offer")
async def offer_endpoint(request: SmallWebRTCRequest, current_user: dict = Depends(get_current_user)):
    """Handle WebRTC offer from client (protected)."""
    try:
        # ... existing connection setup ...

        # Extract user's first name for personalized greeting
        user_full_name = current_user.get("user_metadata", {}).get("full_name", "")
        user_first_name = user_full_name.split()[0] if user_full_name else None

        # Run bot in background with user's name
        runner_args = RunnerArguments()
        import asyncio
        asyncio.create_task(run_bot(transport, runner_args, user_name=user_first_name))

        return answer
    except Exception as e:
        logger.error(f"Offer failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
```

### 4. Global Toaster Configuration

Ensure toast notifications appear on ALL pages, including authentication pages.

**File: `src/App.tsx`**

```typescript
import { Toaster } from "@/components/ui/sonner";

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter>
        <Routes>{/* ... all routes ... */}</Routes>

        {/* Global toaster - MUST be at this level, not inside a specific route */}
        <Toaster theme="dark" position="top-center" />
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

**⚠️ Critical:** Place `<Toaster />` at the App level, NOT inside individual route components!

---

## Complete Edge Cases Reference

### Edge Case Matrix

| Scenario                                 | Error Type              | User Action        | Toast Type                    | Next Step                                      |
| ---------------------------------------- | ----------------------- | ------------------ | ----------------------------- | ---------------------------------------------- |
| Login with wrong password                | Invalid credentials     | Email exists in DB | `error`                       | "Forgot password?" button → `/forgot-password` |
| Login with non-existent email            | Invalid credentials     | Email NOT in DB    | `error`                       | "Sign up" button → `/signup`                   |
| Login before email confirmation          | Email not confirmed     | -                  | `error`                       | Check inbox message                            |
| Signup with existing email               | User already exists     | -                  | `error`                       | "Sign in" button → `/login`                    |
| Password reset for non-existent email    | -                       | Email NOT in DB    | `info`                        | Generic message (prevent enumeration)          |
| Password reset for existing email        | -                       | Email exists in DB | `success`                     | "Check inbox at {email}"                       |
| Reset link expired/invalid               | Token validation failed | -                  | `error`                       | "Request new link" button → `/forgot-password` |
| Password doesn't meet requirements       | Validation failed       | -                  | `error`                       | Show specific requirement message              |
| New password same as old                 | Same password           | -                  | `error`                       | "Password unchanged" message                   |
| Successful signup (with confirmation)    | -                       | -                  | `success`                     | Redirect to `/login`                           |
| Successful signup (without confirmation) | -                       | -                  | `success`                     | Redirect to `/`                                |
| Successful login                         | -                       | -                  | `success` + animated greeting | Redirect to `/`                                |
| Successful password reset                | -                       | -                  | `success`                     | Redirect to `/login` after 1.5s                |

### Error Message Best Practices

1. **Be Specific But Not Too Revealing**

   - ❌ "Email not found in database"
   - ✅ "Account not found. Please sign up first!"

2. **Provide Next Steps**

   - Always include an action button when possible
   - Guide users to the correct page

3. **Use Emojis Sparingly**

   - ✅ Success messages: "🎉" or "✓"
   - ✅ Info messages: "📧"
   - ❌ Error messages: Keep clean, no emojis

4. **Duration Guidelines**
   - Errors: 5000ms (5 seconds)
   - Success: 4000-5000ms
   - Info/Generic: 6000ms
   - Critical info: 8000-10000ms

---

## Summary

This authentication system provides:

- �🔐 **Secure authentication** with Supabase
- 📧 **Email-based password reset** with proper token handling
- ✅ **Email confirmation flow** with clear messaging
- 🛡️ **Protected routes** with automatic redirects
- 💾 **Session persistence** across page refreshes
- 🎨 **Modern, consistent UI** with indigo → purple gradients
- ⚡ **Enhanced toast notifications** with actionable buttons
- 🔒 **Email enumeration prevention** for security
- 👋 **Animated welcome greeting** with rolling text animation
- 🎤 **Personalized backend greetings** with user names
- 🎯 **Intelligent error handling** distinguishing between wrong password and non-existent accounts
- 🌐 **Global toaster** for consistent notifications across all pages

### Key Differentiators

1. **Smart Error Messages**: Distinguish between wrong password and non-existent email
2. **Actionable Feedback**: Every error has a suggested next step with clickable button
3. **Security-First**: Prevents email enumeration while maintaining good UX
4. **Visual Polish**: Animated greetings, consistent color scheme, smooth transitions
5. **Personalization**: User names in greetings (frontend and backend)
6. **Token Validation**: Proper handling of password reset tokens from URL hash
7. **Email Template Configuration**: Correct usage of `{{ .ConfirmationURL }}`

Copy this entire setup for any new React + Supabase project!
