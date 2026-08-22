import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { PayrollGrid } from "@/components/pph/payroll-grid";
import { usePayroll, useWorkspace } from "@/lib/pph/use-workspace";
import { MONTHS } from "@/lib/pph/format";
import { useTaxYear } from "@/lib/pph/tax-year";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/spreadsheet/")({ component: SpreadsheetPage });

const TABS = [
  { id: "PEMOTONG", to: "/pemotong" },
  { id: "ELEMEN", to: "/elemen" },
  { id: "KARYAWAN", to: "/karyawan" },
  ...MONTHS.map((m) => ({ id: m.key, bulan: m.id })),
  { id: "TAHUNAN", to: "/tahunan" },
  { id: "SUMMARY", to: "/summary" },
  { id: "BP21", to: "/non-pegawai" },
  { id: "REF", to: "/referensi" },
] as const;

function SpreadsheetPage() {
  const ws = useWorkspace();
  const [bulan, setBulan] = useState(1);
  const { tahun, setTahun } = useTaxYear(ws.data?.company.tahunPajak ?? 2026);
  const pay = usePayroll(tahun, bulan);
  const activeKey = MONTHS.find((m) => m.id === bulan)?.key;

  return (
    <div>
      <PageHeader
        kicker={`Workbook ${tahun}`}
        title="Buku kerja PPh 21"
        description="Tampilan spreadsheet mengikuti struktur file Excel. Gaji diisi lewat popup; pilih tahun untuk arsip jangka panjang."
      />
      {ws.data ? (
        <div className="glass-strong overflow-hidden rounded-[28px]">
          <div className="p-4">
            <PayrollGrid
              employees={ws.data.employees}
              lines={pay.data ?? []}
              elements={ws.data.elements}
              tahun={tahun}
              bulan={bulan}
              onMonthChange={setBulan}
              onYearChange={setTahun}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto border-t border-white/40 bg-white/25 px-2 py-1.5">
            {TABS.map((tab) => {
              if ("to" in tab && tab.to) {
                return (
                  <Link
                    key={tab.id}
                    to={tab.to}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition-[background-color] duration-150 hover:bg-white/50"
                  >
                    {tab.id}
                  </Link>
                );
              }
              const active = tab.id === activeKey;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => "bulan" in tab && setBulan(tab.bulan)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-[background-color,color] duration-150",
                    active ? "bg-white/80 text-ink shadow-sm" : "text-muted hover:bg-white/40",
                  )}
                >
                  {tab.id}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="h-64 animate-pulse rounded-[24px] bg-surface" />
      )}
    </div>
  );
}
