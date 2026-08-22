import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TZ = "Asia/Makassar";

function formatNow(date: Date) {
  const hari = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    timeZone: TZ,
  }).format(date);
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(date);
  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(date);
  return { hari, tanggal, jam };
}

export function SystemClock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(() => formatNow(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setNow(formatNow(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (compact) {
    return (
      <time className="block text-center text-[11px] font-medium tabular-nums leading-tight text-muted">
        <span className="block capitalize">{now.hari}</span>
        <span className="tabular-nums text-ink">{now.jam} WITA</span>
      </time>
    );
  }

  return (
    <time
      className={cn(
        "flex items-center gap-2 text-[13px] font-medium tabular-nums text-ink",
      )}
    >
      <span className="capitalize text-muted">{now.hari},</span>
      <span>{now.tanggal}</span>
      <span className="text-subtle">·</span>
      <span className="tabular-nums tracking-tight">{now.jam} WITA</span>
    </time>
  );
}
