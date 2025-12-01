import React from "react";
import { cn } from "@/lib/utils";

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function RainbowButton({
  children,
  className,
  ...props
}: RainbowButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-8 py-2 font-medium text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
      <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[length:200%] animate-rainbow [background-image:linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]" />
    </button>
  );
}
