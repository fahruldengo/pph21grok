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

export function LiquidBackdrop() {
  return (
    <div className="liquid-bg" aria-hidden>
      <span className="orb orb-sky" />
      <span className="orb orb-peach" />
      <span className="orb orb-mint" />
      <span className="orb orb-fog" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);

  if (isPending) {
    return (
      <div className="relative min-h-screen">
        <LiquidBackdrop />
        <div className="relative z-10 flex p-3">
          <aside className="glass hidden h-[calc(100vh-24px)] w-60 rounded-[28px] md:block" />
          <div className="flex-1 p-8">
            <p className="text-sm font-medium text-muted">Memuat sesi Pajak21…</p>
            <div className="mt-4 h-8 w-48 animate-pulse rounded-full bg-white/40" />
            <div className="glass mt-8 h-40 rounded-[28px]" />
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="relative min-h-screen">
      <LiquidBackdrop />
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 py-2 md:hidden">
        <div className="glass flex w-full items-center justify-between rounded-[22px] px-2 py-2">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-display text-[17px] font-semibold tracking-tight">Pajak21</span>
          <div className="scale-90">
            <UserButton />
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-40 md:hidden ${open ? "drawer-root is-open" : "drawer-root"}`}>
        <button
          type="button"
          className="drawer-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Tutup menu"
          tabIndex={open ? 0 : -1}
        />
        <aside className="drawer-panel glass absolute inset-y-2 left-2 w-[84%] max-w-xs overflow-y-auto rounded-[28px] p-4">
          <div className="relative z-10 mb-4 flex items-center justify-between">
            <Brand />
            <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative z-10">
            <Nav onNavigate={() => setOpen(false)} />
          </div>
        </aside>
      </div>

      <div className="relative z-10 md:flex md:gap-3 md:p-3">
        <aside className="glass sticky top-3 hidden h-[calc(100vh-24px)] w-[248px] shrink-0 flex-col overflow-y-auto rounded-[28px] px-3 py-4 md:flex">
          <div className="relative z-10 flex h-full flex-col">
            <Brand />
            <div className="mt-6 flex-1">
              <Nav />
            </div>
            <div className="border-t border-white/30 pt-3">
              <UserButton />
            </div>
          </div>
        </aside>
        <main className="glass min-w-0 flex-1 rounded-[28px] px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2">
      <span className="grid size-9 place-items-center rounded-[12px] bg-accent text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]">
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden>
          <path d="M6 8h20v3H6zM6 14.5h12v3H6zM6 21h20v3H6z" fill="currentColor" />
        </svg>
      </span>
      <span>
        <span className="block font-display text-[17px] font-semibold leading-none tracking-tight text-ink">
          Pajak21
        </span>
        <span className="text-[11px] font-medium text-muted">PPh Pasal 21</span>
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
          <p className="px-3 pb-1.5 text-[11px] font-semibold text-subtle">{group.label}</p>
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
                    className={cn("nav-pill", active && "nav-pill-active")}
                  >
                    <Icon className={cn("size-4 shrink-0", active && "text-accent")} />
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
    <div className="relative z-10 mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? <p className="page-kicker text-[13px] font-medium text-accent">{kicker}</p> : null}
        <h1 className="page-title mt-1 font-display text-[32px] font-semibold tracking-tight text-ink sm:text-[40px]">
          {title}
        </h1>
        {description ? (
          <p className="page-desc mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="page-actions flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
