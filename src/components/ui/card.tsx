import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("glass relative overflow-hidden rounded-[28px] p-5 sm:p-6", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "accent" | "ok" | "warn" | "danger" }) {
  const tones = {
    neutral: "bg-white/45 text-muted",
    accent: "bg-accent-soft text-accent",
    ok: "bg-ok/15 text-ok",
    warn: "bg-warn/15 text-warn",
    danger: "bg-danger/15 text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
