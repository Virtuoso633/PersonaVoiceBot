import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);

      const errorMsg = error.message || "";

      // Check if error is due to unconfirmed email
      if (
        errorMsg.toLowerCase().includes("email not confirmed") ||
        errorMsg.toLowerCase().includes("confirm")
      ) {
        toast.error(
          "Please confirm your email address before logging in. Check your inbox!",
          { duration: 6000 }
        );
      }
      // Check if it's invalid login credentials
      else if (
        errorMsg.toLowerCase().includes("invalid login credentials") ||
        errorMsg.toLowerCase().includes("user not found") ||
        errorMsg.toLowerCase().includes("email or password is incorrect")
      ) {
        // Check if email exists by attempting to send reset password email
        // This is a workaround since Supabase doesn't expose user existence directly
        const { error: resetError } = await useAuthStore
          .getState()
          .checkEmailExists(email);

        if (resetError === null) {
          // Email exists (reset email would be sent), so password is wrong
          toast.error("Incorrect password. Please try again.", {
            duration: 5000,
            action: {
              label: "Forgot password?",
              onClick: () => navigate("/forgot-password"),
            },
          });
        } else {
          // Email doesn't exist
          toast.error("Account not found. Please sign up first!", {
            duration: 5000,
            action: {
              label: "Sign up",
              onClick: () => navigate("/signup"),
            },
          });
        }
      } else {
        toast.error(errorMsg || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-[1000px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Nexus AI
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-card/50 border border-border rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <h1 className="text-3xl font-bold mb-2 text-center">Welcome Back</h1>
          <p className="text-muted-foreground text-center mb-8">
            Sign in to continue your AI conversations
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl",
                  "bg-background border border-border",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500",
                  "transition-all duration-200"
                )}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 pr-12 rounded-xl",
                    "bg-background border border-border",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500",
                    "transition-all duration-200"
                  )}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-12 rounded-xl",
                "bg-gradient-to-r from-indigo-500 to-purple-500",
                "hover:from-indigo-600 hover:to-purple-600",
                "text-white font-medium text-base",
                "shadow-lg shadow-indigo-500/30",
                "transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
