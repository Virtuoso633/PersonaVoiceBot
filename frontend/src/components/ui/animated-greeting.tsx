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
      // Call onComplete after slide-out animation finishes
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
        <span className="text-2xl animate-wave">👋</span>
        <span>Hello, {name}!</span>
      </div>
    </div>
  );
}
