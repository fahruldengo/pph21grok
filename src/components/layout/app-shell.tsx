import { Link, useRouterState } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  BookOpen,
  Building2,
  Calculator,
  CalendarRange,
  FileSpreadsheet,
  LayoutDashboard,
  Library,
  Menu,
  Receipt,
  Scale,
  Table2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    label: "Perusahaan",
    items: [
      { to: "/", icon: LayoutDashboard, title: "Ringkasan" },
      { to: "/pemotong", icon: Building2, title: "Pemotong" },
      { to: "/elemen", icon: Scale, title: "Elemen PPh 21" },
    ],
  },
  {
    label: "Spreadsheet",
    items: [
      { to: "/karyawan", icon: Users, title: "Karyawan" },
      { to: "/penghasilan", icon: Table2, title: "Penghasilan" },
      { to: "/spreadsheet", icon: FileSpreadsheet, title: "Buku Kerja" },
    ],
  },
  {
    label: "Perhitungan",
    items: [
      { to: "/kalkulator", icon: Calculator, title: "Kalkulator" },
      { to: "/tahunan", icon: CalendarRange, title: "Tahunan / Desember" },
      { to: "/summary", icon: Wallet, title: "Summary" },
    ],
  },
  {
    label: "Laporan",
    items: [
      { to: "/bukti-potong", icon: Receipt, title: "Bukti Potong" },
      { to: "/non-pegawai", icon: BookOpen, title: "Non Pegawai" },
      { to: "/referensi", icon: Library, title: "Referensi" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);

  if (isPending) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="flex">
          <aside className="hidden h-screen w-64 border-r border-border bg-surface md:block" />
          <div className="flex-1 p-8">
            <p className="text-sm font-medium text-muted">Memuat sesi Pajak21…</p>
            <div className="mt-4 h-8 w-48 animate-pulse rounded-md bg-border" />
            <div className="mt-8 h-40 animate-pulse rounded-[24px] bg-surface" />
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-[12px] border border-border"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
        >
          <Menu className="size-5" />
        </button>
        <span className="font-display text-lg">Pajak21</span>
        <div className="scale-90">
          <UserButton />
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          />
          <aside className="absolute inset-y-0 left-0 w-[84%] max-w-xs overflow-y-auto bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} className="size-11">
                <X className="size-5" />
              </button>
            </div>
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="md:flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-border bg-surface px-4 py-5 md:flex md:flex-col">
          <Brand />
          <div className="mt-6 flex-1">
            <Nav />
          </div>
          <div className="border-t border-border pt-4">
            <UserButton />
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-1">
      <span className="grid size-9 place-items-center rounded-[10px] bg-accent text-accent-fg">
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden>
          <path d="M6 8h20v3H6zM6 14.5h12v3H6zM6 21h20v3H6z" fill="currentColor" />
        </svg>
      </span>
      <span>
        <span className="block font-display text-lg leading-none text-ink">Pajak21</span>
        <span className="text-[11px] uppercase tracking-wider text-muted">PPh Pasal 21</span>
      </span>
    </Link>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-5">
      {NAV.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[12px] px-2.5 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-accent text-accent-fg"
                        : "text-fg hover:bg-accent-soft",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{kicker}</p>
        ) : null}
        <h1 className="mt-1 font-display text-3xl tracking-tight text-ink sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
