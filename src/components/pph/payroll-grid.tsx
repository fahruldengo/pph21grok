import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { calculateMonthly, type TaxElements } from "@/lib/pph/calculate";
import { formatPct, formatRp, MONTHS } from "@/lib/pph/format";
import { copyMonth, savePayroll } from "@/lib/server/pph";
import type { Employee, PayrollLine } from "@/lib/pph/types";
import { cn } from "@/lib/utils";

type Draft = {
  gaji: number;
  tunjangan: number;
  honorarium: number;
  uangMakan: number;
  uangLembur: number;
  penghasilanLain: number;
  natura: number;
  bonus: number;
  thr: number;
  tantiem: number;
  zakat: number;
};

const EMPTY: Draft = {
  gaji: 0,
  tunjangan: 0,
  honorarium: 0,
  uangMakan: 0,
  uangLembur: 0,
  penghasilanLain: 0,
  natura: 0,
  bonus: 0,
  thr: 0,
  tantiem: 0,
  zakat: 0,
};

function toDraft(line?: PayrollLine): Draft {
  if (!line) return { ...EMPTY };
  return {
    gaji: line.gaji,
    tunjangan: line.tunjangan,
    honorarium: line.honorarium,
    uangMakan: line.uangMakan,
    uangLembur: line.uangLembur,
    penghasilanLain: line.penghasilanLain,
    natura: line.natura,
    bonus: line.bonus,
    thr: line.thr,
    tantiem: line.tantiem,
    zakat: line.zakat,
  };
}

export function PayrollGrid({
  employees,
  lines,
  elements,
  tahun,
  bulan,
  onMonthChange,
}: {
  employees: Employee[];
  lines: PayrollLine[];
  elements: TaxElements;
  tahun: number;
  bulan: number;
  onMonthChange?: (bulan: number) => void;
}) {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [copyFrom, setCopyFrom] = useState(1);
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setDrafts({});
  }, [bulan, tahun]);


  const byEmp = useMemo(() => {
    const m = new Map<number, PayrollLine>();
    for (const l of lines) m.set(l.employeeId, l);
    return m;
  }, [lines]);

  const save = useMutation({
    mutationFn: savePayroll,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["payroll"] });
      await qc.invalidateQueries({ queryKey: ["payroll-year"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = useMutation({
    mutationFn: copyMonth,
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["payroll"] });
      toast.success(`Disalin ${r.copied} baris`);
    },
  });

  const rows = employees.map((emp) => {
    const d = drafts[emp.id] ?? toDraft(byEmp.get(emp.id));
    const calc = calculateMonthly(
      {
        ...d,
        ptkp: emp.ptkp,
        grossUp: emp.grossUp,
        punyaNpwp: emp.punyaNpwp,
      },
      elements,
    );
    return { emp, d, calc };
  });

  const totalPph = rows.reduce((s, r) => s + r.calc.pph, 0);
  const totalBruto = rows.reduce((s, r) => s + r.calc.bruto, 0);

  function patch(id: number, key: keyof Draft, value: number) {
    const base = drafts[id] ?? toDraft(byEmp.get(id));
    const next = { ...base, [key]: value };
    setDrafts((prev) => ({ ...prev, [id]: next }));
    window.clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      save.mutate({
        data: { tahun, bulan, line: { employeeId: id, ...next } },
      });
    }, 500);
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {onMonthChange
          ? MONTHS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onMonthChange(m.id)}
                className={cn(
                  "h-9 rounded-full px-3 text-sm font-semibold",
                  m.id === bulan ? "bg-accent text-accent-fg" : "bg-computed text-muted hover:bg-accent-soft",
                )}
              >
                {m.short}
              </button>
            ))
          : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={String(copyFrom)} onChange={(e) => setCopyFrom(Number(e.target.value))}>
            {MONTHS.map((m) => (
              <option key={m.id} value={m.id}>
                Salin dari {m.label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              copy.mutate({ data: { tahun, fromBulan: copyFrom, toBulan: bulan } })
            }
          >
            Salin gaji pokok
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Karyawan" value={String(rows.length)} />
        <Stat label="Bruto bulan ini" value={formatRp(totalBruto)} />
        <Stat label="PPh 21 terutang" value={formatRp(totalPph)} />
      </div>

      <div className="overflow-auto rounded-[20px] border border-border bg-elevated">
        <table className="sheet-grid min-w-[1280px] w-full text-left text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 px-3 py-2">Nama</th>
              <th className="px-3 py-2">PTKP</th>
              <th className="px-3 py-2">Gross up</th>
              <th className="px-3 py-2 cell-input">Gaji</th>
              <th className="px-3 py-2 cell-input-alt">Tunjangan</th>
              <th className="px-3 py-2 cell-input">Honor</th>
              <th className="px-3 py-2 cell-input-alt">Bonus / THR</th>
              <th className="px-3 py-2">Premi</th>
              <th className="px-3 py-2">Tunj. PPh</th>
              <th className="px-3 py-2">Bruto</th>
              <th className="px-3 py-2">TER</th>
              <th className="px-3 py-2">PPh 21</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ emp, d, calc }) => (
              <tr key={`${emp.id}-${bulan}`} className="hover:bg-accent-soft/40">
                <td className="sticky left-0 z-10 bg-elevated px-3 py-1.5 font-medium">
                  <div>{emp.nama}</div>
                  <div className="text-[11px] text-muted">{emp.jabatan}</div>
                </td>
                <td className="px-3 py-1.5 tabular-nums">{emp.ptkp}</td>
                <td className="px-3 py-1.5">{emp.grossUp ? "Ya" : "Tidak"}</td>
                <MoneyCell value={d.gaji} onChange={(v) => patch(emp.id, "gaji", v)} tone="blue" />
                <MoneyCell value={d.tunjangan} onChange={(v) => patch(emp.id, "tunjangan", v)} tone="green" />
                <MoneyCell value={d.honorarium} onChange={(v) => patch(emp.id, "honorarium", v)} tone="blue" />
                <MoneyCell
                  value={d.bonus + d.thr}
                  onChange={(v) => patch(emp.id, "bonus", v)}
                  tone="green"
                />
                <td className="cell-computed px-3 py-1.5 tabular-nums">{formatRp(calc.premi.totalAddBruto, false)}</td>
                <td className="cell-computed px-3 py-1.5 tabular-nums">{formatRp(calc.tunjanganPph, false)}</td>
                <td className="cell-computed px-3 py-1.5 tabular-nums font-semibold">{formatRp(calc.bruto, false)}</td>
                <td className="px-3 py-1.5 text-xs">
                  {calc.kategoriTer}
                  <div className="tabular-nums text-muted">{formatPct(calc.tarifTer)}</div>
                </td>
                <td className="px-3 py-1.5 tabular-nums font-semibold text-ink">{formatRp(calc.pph, false)}</td>
                <td className="px-2 py-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      save.mutate(
                        {
                          data: {
                            tahun,
                            bulan,
                            line: { employeeId: emp.id, ...d },
                          },
                        },
                        { onSuccess: () => toast.success("Baris tersimpan") },
                      )
                    }

                  >
                    Simpan
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Kolom biru dan hijau adalah input, sesuai workbook Excel. Nilai lain dihitung otomatis dengan TER
        (PP 58/2023). Gross-up menyelesaikan tunjangan PPh secara iteratif.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-[22px] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums text-ink">{value}</p>
    </div>
  );
}

function MoneyCell({
  value,
  onChange,
  tone,
}: {
  value: number;
  onChange: (n: number) => void;
  tone: "blue" | "green";
}) {
  return (
    <td className={tone === "blue" ? "cell-input p-0" : "cell-input-alt p-0"}>
      <input
        className="h-10 w-32 bg-transparent px-2 text-right tabular-nums outline-none"
        value={value ? String(Math.round(value)) : ""}
        onChange={(e) => onChange(Number(String(e.target.value).replace(/[^\d.-]/g, "")) || 0)}
      />
    </td>
  );
}
