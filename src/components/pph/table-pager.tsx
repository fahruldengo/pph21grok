import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const PAGE_SIZES = [5, 10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

function readSize(key: string, fallback: PageSize): PageSize {
  try {
    const n = Number(localStorage.getItem(`pajak21.pagesize.${key}`));
    if ((PAGE_SIZES as readonly number[]).includes(n)) return n as PageSize;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function usePaged<T>(items: T[], storageKey: string, fallback: PageSize = 10) {
  const [size, setSize] = useState<PageSize>(() => readSize(storageKey, fallback));
  const [page, setPage] = useState(1);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size) || 1);
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * size;
  const rows = items.slice(start, start + size);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  function setPageSize(next: PageSize) {
    setSize(next);
    setPage(1);
    try {
      localStorage.setItem(`pajak21.pagesize.${storageKey}`, String(next));
    } catch {
      /* ignore */
    }
  }

  const resetPage = useCallback(() => setPage(1), []);

  return {
    rows,
    total,
    pages,
    page: safePage,
    pageSize: size,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(total, start + size),
    setPage,
    setPageSize,
    resetPage,
  };
}

export function TablePager({
  total,
  page,
  pages,
  from,
  to,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  pages: number;
  from: number;
  to: number;
  pageSize: PageSize;
  onPage: (page: number) => void;
  onPageSize: (size: PageSize) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="pr-1 text-sm text-muted">Tampil</span>
        {PAGE_SIZES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageSize(n)}
            className={cn(
              "h-9 min-w-9 rounded-full px-2.5 text-sm font-semibold tabular-nums transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96]",
              pageSize === n
                ? "bg-accent text-accent-fg"
                : "bg-white/40 text-muted hover:bg-white/60",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="tabular-nums">
          {from}–{to} dari {total}
        </span>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/45 active:scale-[0.96] disabled:opacity-35"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="min-w-10 text-center tabular-nums font-semibold text-ink">
          {page}/{pages}
        </span>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/45 active:scale-[0.96] disabled:opacity-35"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
