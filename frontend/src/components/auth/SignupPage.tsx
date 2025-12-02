import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignupPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((state) => state.signUp);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Must contain at least one number";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, fullName);

      // Check if email confirmation is required
      // If session is null, email confirmation is needed
      if (!result?.session) {
        // Email confirmation required
        toast.success(
          "🎉 Account created! Please check your email to confirm your account.",
          {
            duration: 10000,
            description: "We've sent a confirmation link to " + email,
          }
        );
        // Redirect to login page
        navigate("/login");
      } else {
        // Email confirmation disabled, user is logged in
        toast.success("🎉 Welcome to Nexus AI!", {
          description: "Your account has been created successfully.",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("Signup error:", error);

      const errorMsg = error.message || "";

      // Check if user already exists
      if (
        errorMsg.toLowerCase().includes("already registered") ||
        errorMsg.toLowerCase().includes("user already exists") ||
        errorMsg.toLowerCase().includes("duplicate")
      ) {
        toast.error("This email is already registered", {
          duration: 5000,
          description: "Please sign in to your existing account.",
          action: {
            label: "Sign in",
            onClick: () => navigate("/login"),
          },
        });
      } else {
        toast.error(errorMsg || "Failed to create account", {
          description:
            "Please try again or contact support if the issue persists.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-[1000px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

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

        {/* Signup Card */}
        <div className="bg-card/50 border border-border rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

          <h1 className="text-3xl font-bold mb-2 text-center">
            Create Account
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Join Nexus AI and start your journey
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-foreground"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl",
                  "bg-background border border-border",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500",
                  "transition-all duration-200"
                )}
                placeholder="John Doe"
                disabled={loading}
              />
            </div>

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
                  "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500",
                  "transition-all duration-200"
                )}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
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
                    "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500",
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
              <p className="text-xs text-muted-foreground">
                8+ characters with uppercase, lowercase, and number
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-12 rounded-xl",
                "bg-gradient-to-r from-purple-500 to-pink-500",
                "hover:from-purple-600 hover:to-pink-600",
                "text-white font-medium text-base",
                "shadow-lg shadow-purple-500/30",
                "transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-500 hover:text-purple-400 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
