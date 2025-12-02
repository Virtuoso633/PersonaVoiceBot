import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Sparkles,
  Github,
  ArrowRight,
  X,
  Code,
  Cpu,
  Layers,
  Zap,
  Terminal,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Ripple from "@/components/magicui/ripple";
import Marquee from "@/components/magicui/marquee";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { UserMenu } from "@/components/ui/user-menu";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";

// --- Helper Components ---

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function StreamingText({
  text,
  isAssistant,
}: {
  text: string;
  isAssistant: boolean;
}) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isAssistant) {
      setDisplayedText(text);
      return;
    }

    let i = displayedText.length;
    if (i >= text.length) return;

    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return text.slice(0, prev.length + 1);
      });
    }, 30);

    return () => clearInterval(interval);
  }, [text, isAssistant, displayedText.length]);

  useEffect(() => {
    if (text.length < displayedText.length) {
      setDisplayedText(text);
    }
  }, [text, displayedText.length]);

  return <>{displayedText}</>;
}

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/50 backdrop-blur-xl h-16 md:h-20 transition-all duration-300">
      <div className="container mx-auto flex h-full items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight text-foreground group cursor-pointer">
          <div className="p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg group-hover:rotate-12 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-white animate-[spin_3s_linear_infinite]" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 group-hover:to-indigo-400 transition-all duration-300">
            Nexus AI
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 md:pt-32 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-card/50 border border-border rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl md:text-4xl font-bold">
            {username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{username}</h1>
            <p className="text-muted-foreground">
              Full Stack Developer & AI Enthusiast
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Email
            </h3>
            <p className="text-foreground">{username}@example.com</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Member Since
            </h3>
            <p className="text-foreground">November 2025</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex justify-end">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7860";

function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [messages, setMessages] = useState<
    { role: string; text: string; isFinal?: boolean }[]
  >([]);

  useEffect(() => {
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  const startInterview = async () => {
    try {
      // Fetch connection details including ICE servers
      const connRes = await fetch(`${API_URL}/`);
      if (!connRes.ok) throw new Error("Failed to get connection details");
      const connDetails = await connRes.json();

      const pc = new RTCPeerConnection({
        iceServers: connDetails.ice_servers || [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (audioRef.current && event.streams[0]) {
          audioRef.current.srcObject = event.streams[0];
          setIsSpeaking(true);
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const dc = pc.createDataChannel("chat");
      dc.onopen = () => console.log("Data channel open");
      dc.onmessage = handleMessage;

      let sessionId: string | null = null;
      const candidateQueue: RTCIceCandidate[] = [];

      const sendCandidate = async (id: string, candidate: RTCIceCandidate) => {
        try {
          const candidateJSON = candidate.toJSON();
          await fetch(`${API_URL}/candidate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pc_id: id,
              candidates: [
                {
                  candidate: candidateJSON.candidate,
                  sdp_mid: candidateJSON.sdpMid,
                  sdp_mline_index: candidateJSON.sdpMLineIndex,
                },
              ],
            }),
          });
        } catch (err) {
          console.warn("Failed to send candidate:", err);
        }
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          if (sessionId) {
            await sendCandidate(sessionId, event.candidate);
          } else {
            candidateQueue.push(event.candidate);
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch(`${API_URL}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
      });

      if (!res.ok) throw new Error("Failed to get offer");
      const answer = await res.json();
      sessionId = answer.pc_id;

      // Flush candidate queue
      for (const candidate of candidateQueue) {
        if (sessionId) {
          await sendCandidate(sessionId, candidate);
        }
      }

      await pc.setRemoteDescription(answer);

      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dc.onmessage = handleMessage;
      };

      setIsConnected(true);
      toast.success("Connected to AI Persona");
    } catch (err) {
      console.error("Connection failed:", err);
      toast.error("Failed to connect. Is the server running?");
      setIsConnected(false);
    }
  };

  const handleMessage = (e: MessageEvent) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === "transcription" || msg.type === "text") {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === msg.role && !last.isFinal) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                text: last.text + msg.text,
                isFinal: msg.is_final ?? true,
              },
            ];
          }
          if (msg.type === "text") {
            if (last && last.role === "assistant")
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + msg.text },
              ];
            return [
              ...prev,
              { role: "assistant", text: msg.text, isFinal: true },
            ];
          }
          if (msg.type === "transcription") {
            if (last && last.role === "user" && !last.isFinal)
              return [
                ...prev.slice(0, -1),
                { role: "user", text: msg.text, isFinal: msg.is_final },
              ];
            return [
              ...prev,
              { role: "user", text: msg.text, isFinal: msg.is_final },
            ];
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn("Failed to parse message:", err);
    }
  };

  const endInterview = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setMessages([]);
    toast.info("Session ended");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />

      <main className="relative pt-24 md:pt-32 pb-16 px-4 md:px-8">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-[1000px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

        {!isConnected ? (
          <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Introducing Personal Voice Assistant
              <ArrowRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight pb-2 relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 relative z-10">
                Intelligent Voice Interface <br />
                for the Modern Web.
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 blur-2xl -z-10" />
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience natural, real-time conversations with a custom AI
              persona. Powered by Pipecat, Deepgram, and OpenAI for seamless
              interaction.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <RainbowButton
                onClick={startInterview}
                className="h-[50px] rounded-full shadow-md"
              >
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight lg:text-lg text-black dark:text-white">
                  Start Conversation
                </span>
                <ArrowRight className="w-4 h-4 ml-2 text-black dark:text-white" />
              </RainbowButton>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <Button
                  variant="outline"
                  size="lg"
                  className="relative h-[50px] px-8 rounded-full border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground font-medium text-base transition-all"
                >
                  View Source Code
                  <Github className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Tech Stack Marquee */}
            <div className="pt-16 max-w-4xl mx-auto overflow-hidden mask-gradient-x">
              <Marquee className="[--duration:20s]" pauseOnHover>
                <div className="flex items-center gap-2 text-muted-foreground mx-8">
                  <Code className="w-5 h-5" /> React
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mx-8">
                  <Terminal className="w-5 h-5" /> TypeScript
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mx-8">
                  <Layers className="w-5 h-5" /> Tailwind
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mx-8">
                  <Cpu className="w-5 h-5" /> OpenAI
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mx-8">
                  <Zap className="w-5 h-5" /> Pipecat
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mx-8">
                  <Sparkles className="w-5 h-5" /> Deepgram
                </div>
              </Marquee>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Active Session View */}
            <div className="relative aspect-[3/4] sm:aspect-video bg-card/50 border border-border rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
              <Ripple
                mainCircleSize={120}
                numCircles={6}
                className="opacity-50"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                {/* Status */}
                <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/40 border border-border backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Live Session
                  </span>
                </div>

                <div className="absolute top-6 right-6">
                  <Button
                    onClick={endInterview}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Center Visual */}
                <div className="relative mb-12">
                  <div
                    className={cn(
                      "w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.4)] transition-transform duration-300",
                      isSpeaking ? "scale-110" : "scale-100"
                    )}
                  >
                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  </div>
                </div>

                {/* Transcript */}
                <div className="w-full max-w-2xl space-y-4 max-h-[300px] sm:max-h-[200px] overflow-y-auto no-scrollbar mask-gradient-b">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm">
                      Listening...
                    </p>
                  ) : (
                    messages.slice(-2).map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "text-center",
                          msg.role === "user"
                            ? "text-muted-foreground text-sm"
                            : "text-foreground text-lg font-medium leading-relaxed"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <StreamingText text={msg.text} isAssistant={true} />
                        ) : (
                          msg.text
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <audio ref={audioRef} autoPlay />
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:username" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
