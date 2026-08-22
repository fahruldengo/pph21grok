import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const WINDOW_AFTER = 80;

export function VirtualSheet({
  count,
  rowHeight = 52,
  overscan = 16,
  minWidth,
  maxHeight = "min(68vh, 740px)",
  header,
  renderRow,
  className,
}: {
  count: number;
  rowHeight?: number;
  overscan?: number;
  minWidth: string;
  maxHeight?: string;
  header: ReactNode;
  renderRow: (index: number) => ReactNode;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const windowed = count > WINDOW_AFTER;
  const [range, setRange] = useState({ start: 0, end: count });

  const update = useCallback(() => {
    if (!windowed) {
      setRange({ start: 0, end: count });
      return;
    }
    const el = scroller.current;
    const height = el?.clientHeight || 640;
    const start = Math.max(0, Math.floor((el?.scrollTop ?? 0) / rowHeight) - overscan);
    const visible = Math.ceil(height / rowHeight) + overscan * 2;
    const end = Math.min(count, start + Math.max(visible, 48));
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [count, overscan, rowHeight, windowed]);

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, count]);

  const start = windowed ? range.start : 0;
  const end = windowed ? Math.min(range.end, count) : count;
  const padTop = windowed ? start * rowHeight : 0;
  const padBottom = windowed ? Math.max(0, (count - end) * rowHeight) : 0;

  return (
    <div
      ref={scroller}
      onScroll={windowed ? update : undefined}
      className={cn("overflow-auto rounded-[20px] border border-border bg-elevated", className)}
      style={{ maxHeight }}
    >
      <table className="sheet-grid w-full text-left text-sm" style={{ minWidth }}>
        <thead className="sticky top-0 z-20">{header}</thead>
        <tbody>
          {padTop > 0 ? (
            <tr aria-hidden>
              <td colSpan={24} className="p-0" style={{ height: padTop, border: 0 }} />
            </tr>
          ) : null}
          {Array.from({ length: Math.max(0, end - start) }, (_, i) => renderRow(start + i))}
          {padBottom > 0 ? (
            <tr aria-hidden>
              <td colSpan={24} className="p-0" style={{ height: padBottom, border: 0 }} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
