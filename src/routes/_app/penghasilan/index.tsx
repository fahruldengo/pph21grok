import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { PayrollGrid } from "@/components/pph/payroll-grid";
import { usePayroll, useWorkspace } from "@/lib/pph/use-workspace";
import { monthLabel } from "@/lib/pph/format";
import { useTaxYear } from "@/lib/pph/tax-year";

export const Route = createFileRoute("/_app/penghasilan/")({ component: PenghasilanPage });

function PenghasilanPage() {
  const ws = useWorkspace();
  const [bulan, setBulan] = useState(1);
  const { tahun, setTahun } = useTaxYear(ws.data?.company.tahunPajak ?? 2026);
  const pay = usePayroll(tahun, bulan);

  return (
    <div>
      <PageHeader
        kicker={`Sheet ${monthLabel(bulan).toUpperCase()} ${tahun}`}
        title="Input penghasilan"
        description="Pilih tahun pajak, lalu tambah gaji lewat popup. Lembur diinput terpisah, tetapi di rekapan masuk kolom tunjangan. Karyawan resign tidak muncul di daftar tambah gaji."
      />
      {ws.data ? (
        <PayrollGrid
          employees={ws.data.employees}
          lines={pay.data ?? []}
          elements={ws.data.elements}
          tahun={tahun}
          bulan={bulan}
          onMonthChange={setBulan}
          onYearChange={setTahun}
        />
      ) : (
        <div className="h-48 animate-pulse rounded-[24px] bg-surface" />
      )}
    </div>
  );
}
