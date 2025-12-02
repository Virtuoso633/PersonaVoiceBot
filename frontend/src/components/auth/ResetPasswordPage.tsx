import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Sparkles, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  // Handle the password reset token from the URL
  useEffect(() => {
    const handleResetToken = async () => {
      try {
        // First, try to get the token from the URL hash (proper Supabase format)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        // Also check for query parameter format (fallback/legacy)
        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get("token");

        if (type === "recovery" && accessToken) {
          // Proper Supabase format with access_token in hash
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            console.error("Session setup error:", error);
            toast.error("Invalid or expired reset link", {
              description: "Please request a new password reset link.",
              action: {
                label: "Request new link",
                onClick: () => navigate("/forgot-password"),
              },
            });
            setTokenValid(false);
          } else {
            setTokenValid(true);
          }
        } else if (queryToken) {
          // Fallback: Handle query parameter format (legacy or custom email template)
          // This format doesn't give us the full token, so show an error with instructions
          toast.error("Incorrect reset link format", {
            description:
              "Your Supabase email template needs to be updated. Please check the email template configuration.",
            duration: 10000,
          });
          setTokenValid(false);
        } else {
          toast.error("Invalid reset link", {
            description:
              "This link appears to be invalid. Please request a new one.",
            action: {
              label: "Request new link",
              onClick: () => navigate("/forgot-password"),
            },
          });
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

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    return null;
  };

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
        duration: 5000,
        description: "You can now sign in with your new password.",
      });

      // Wait a moment before redirecting
      setTimeout(() => navigate("/login"), 1500);
    } catch (error: any) {
      console.error("Password reset error:", error);

      const errorMsg = error.message || "";

      // Provide specific error messages
      if (errorMsg.toLowerCase().includes("same as old password")) {
        toast.error("Password unchanged", {
          description: "New password must be different from your old password.",
        });
      } else {
        toast.error("Failed to reset password", {
          description:
            errorMsg || "Please try again or request a new reset link.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-[1000px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Nexus AI
          </span>
        </div>

        <div className="bg-card/50 border border-border rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <h1 className="text-3xl font-bold mb-2 text-center">
            Reset Password
          </h1>

          {checkingToken ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
              <p className="text-muted-foreground text-center">
                Verifying reset link...
              </p>
            </div>
          ) : !tokenValid ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                This reset link is invalid or has expired.
              </p>
              <Button
                onClick={() => navigate("/forgot-password")}
                className={cn(
                  "w-full h-12 rounded-xl",
                  "bg-gradient-to-r from-indigo-500 to-purple-500",
                  "hover:from-indigo-600 hover:to-purple-600",
                  "text-white font-medium text-base"
                )}
              >
                Request New Link
              </Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-center mb-8">
                Choose a new strong password for your account
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    New Password
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
                  <p className="text-xs text-muted-foreground">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl",
                      "bg-background border border-border",
                      "text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500",
                      "transition-all duration-200"
                    )}
                    placeholder="••••••••"
                    disabled={loading}
                  />
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
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
