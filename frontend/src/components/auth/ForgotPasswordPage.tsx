import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // First, check if the email exists in the database
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7860";
      const checkResponse = await fetch(`${API_URL}/auth/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const checkData = await checkResponse.json();

      if (!checkData.exists) {
        // Email doesn't exist in database
        // Still show generic message for security (prevent email enumeration)
        toast.info(
          `If there's an account registered with ${email}, you will receive your reset link.`,
          { duration: 6000 }
        );
        setSent(true);
        setLoading(false);
        return;
      }

      // Email exists, proceed to send reset link
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast.success("Password reset email sent!", {
        duration: 8000,
        description: `Check your inbox at ${email} for the reset link.`,
      });
    } catch (error: any) {
      console.error("Password reset error:", error);

      const errorMsg = error.message || "";

      toast.error("Failed to send reset email", {
        description: errorMsg || "Please try again or contact support.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-[1000px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-card/50 border border-border rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to reset your password.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Forgot Password?
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Enter your email and we'll send you a link to reset your password
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
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
