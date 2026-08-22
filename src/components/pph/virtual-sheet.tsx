import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function VirtualSheet({
  count,
  rowHeight = 52,
  overscan = 10,
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
  const [range, setRange] = useState({ start: 0, end: Math.min(count, 24) });

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const start = Math.max(0, Math.floor(el.scrollTop / rowHeight) - overscan);
    const visible = Math.ceil(el.clientHeight / rowHeight) + overscan * 2;
    const end = Math.min(count, start + Math.max(visible, 12));
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [count, overscan, rowHeight]);

  useEffect(() => {
    update();
  }, [update, count]);

  const padTop = range.start * rowHeight;
  const padBottom = Math.max(0, (count - range.end) * rowHeight);

  return (
    <div
      ref={scroller}
      onScroll={update}
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
          {Array.from({ length: Math.max(0, range.end - range.start) }, (_, i) =>
            renderRow(range.start + i),
          )}
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
