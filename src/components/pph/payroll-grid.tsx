import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, MoneyInput, Select } from "@/components/ui/input";
import { GlassModal } from "@/components/ui/modal";
import { TablePager, usePaged } from "@/components/pph/table-pager";
import { VirtualSheet } from "@/components/pph/virtual-sheet";
import { YearSelect } from "@/components/pph/year-select";
import { calculateMonthly, type TaxElements } from "@/lib/pph/calculate";
import { formatPct, formatRp, MONTHS } from "@/lib/pph/format";
import { canAddSalary, showInPayrollRecap } from "@/lib/pph/status";
import { yearOptions } from "@/lib/pph/tax-year";
import { copyMonth, deletePayroll, savePayroll } from "@/lib/server/pph";
import { gajiDibayar, type Employee, type PayrollLine } from "@/lib/pph/types";
import { cn } from "@/lib/utils";

type FormState = {
  employeeId: number | "";
  gaji: number;
  tunjangan: number;
  uangLembur: number;
  honorarium: number;
  bonus: number;
  penguranganGaji: number;
};

const EMPTY_FORM: FormState = {
  employeeId: "",
  gaji: 0,
  tunjangan: 0,
  uangLembur: 0,
  honorarium: 0,
  bonus: 0,
  penguranganGaji: 0,
};

export function PayrollGrid({
  employees,
  lines,
  elements,
  tahun,
  bulan,
  onMonthChange,
  onYearChange,
}: {
  employees: Employee[];
  lines: PayrollLine[];
  elements: TaxElements;
  tahun: number;
  bulan: number;
  onMonthChange?: (bulan: number) => void;
  onYearChange?: (tahun: number) => void;
}) {
  const qc = useQueryClient();
  const [copyFrom, setCopyFrom] = useState(1);
  const [copyFromYear, setCopyFromYear] = useState(tahun);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

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
      setOpen(false);
      toast.success("Gaji tersimpan");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: deletePayroll,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["payroll"] });
      await qc.invalidateQueries({ queryKey: ["payroll-year"] });
      toast.success("Gaji dihapus");
    },
  });

  const copy = useMutation({
    mutationFn: copyMonth,
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["payroll"] });
      await qc.invalidateQueries({ queryKey: ["payroll-year"] });
      toast.success(`Disalin ${r.copied} baris`);
    },
  });

  const rows = employees
    .filter((emp) => byEmp.has(emp.id) && showInPayrollRecap(emp, bulan))
    .map((emp) => {
      const line = byEmp.get(emp.id)!;
      const calc = calculateMonthly(
        {
          gaji: gajiDibayar(line.gaji, line.penguranganGaji),
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
          ptkp: emp.ptkp,
          grossUp: emp.grossUp,
          punyaNpwp: emp.punyaNpwp,
        },
        elements,
      );
      return { emp, line, calc, tunjanganRecap: line.tunjangan + line.uangLembur };
    });

  const paged = usePaged(rows, "penghasilan", 10);
  const { resetPage } = paged;

  useEffect(() => {
    resetPage();
  }, [tahun, bulan, resetPage]);
  const totalPph = rows.reduce((s, r) => s + r.calc.pph, 0);
  const totalBruto = rows.reduce((s, r) => s + r.calc.bruto, 0);

  const taken = new Set(rows.map((r) => r.emp.id));
  const available = employees.filter((e) => canAddSalary(e, bulan) && (editingId === e.id || !taken.has(e.id)));

  const selected = employees.find((e) => e.id === form.employeeId);
  const existing = typeof form.employeeId === "number" ? byEmp.get(form.employeeId) : undefined;
  const preview =
    selected &&
    calculateMonthly(
      {
        gaji: gajiDibayar(form.gaji, form.penguranganGaji),
        tunjangan: form.tunjangan,
        honorarium: form.honorarium,
        uangMakan: existing?.uangMakan ?? 0,
        uangLembur: form.uangLembur,
        penghasilanLain: existing?.penghasilanLain ?? 0,
        natura: existing?.natura ?? 0,
        bonus: form.bonus,
        thr: existing?.thr ?? 0,
        tantiem: existing?.tantiem ?? 0,
        zakat: existing?.zakat ?? 0,
        ptkp: selected.ptkp,
        grossUp: selected.grossUp,
        punyaNpwp: selected.punyaNpwp,
      },
      elements,
    );

  function openAdd() {
    if (!employees.some((e) => canAddSalary(e, bulan))) {
      toast.error("Tidak ada karyawan aktif untuk bulan ini. Yang resign hanya masuk laporan tahunan.");
      return;
    }
    if (!available.length) {
      toast.error("Semua karyawan sudah punya gaji bulan ini");
      return;
    }
    const first = available[0];
    setEditingId(null);
    setForm({
      employeeId: first.id,
      gaji: first.gaji,
      tunjangan: first.tunjangan,
      uangLembur: 0,
      honorarium: 0,
      bonus: 0,
      penguranganGaji: 0,
    });
    setOpen(true);
  }

  function openEdit(emp: Employee, line: PayrollLine) {
    setEditingId(emp.id);
    setForm({
      employeeId: emp.id,
      gaji: line.gaji,
      tunjangan: line.tunjangan,
      uangLembur: line.uangLembur,
      honorarium: line.honorarium,
      bonus: line.bonus + line.thr,
      penguranganGaji: line.penguranganGaji ?? 0,
    });
    setOpen(true);
  }

  function pickEmployee(id: number) {
    const emp = employees.find((e) => e.id === id);
    const line = byEmp.get(id);
    if (line) {
      setForm({
        employeeId: id,
        gaji: line.gaji,
        tunjangan: line.tunjangan,
        uangLembur: line.uangLembur,
        honorarium: line.honorarium,
        bonus: line.bonus + line.thr,
        penguranganGaji: line.penguranganGaji ?? 0,
      });
      return;
    }
    setForm({
      employeeId: id,
      gaji: emp?.gaji ?? 0,
      tunjangan: emp?.tunjangan ?? 0,
      uangLembur: 0,
      honorarium: 0,
      bonus: 0,
      penguranganGaji: 0,
    });
  }

  function submit() {
    if (form.employeeId === "") {
      toast.error("Pilih karyawan");
      return;
    }
    const line = byEmp.get(form.employeeId);
    save.mutate({
      data: {
        tahun,
        bulan,
        line: {
          employeeId: form.employeeId,
          gaji: form.gaji,
          tunjangan: form.tunjangan,
          honorarium: form.honorarium,
          uangMakan: line?.uangMakan ?? 0,
          uangLembur: form.uangLembur,
          penghasilanLain: line?.penghasilanLain ?? 0,
          natura: line?.natura ?? 0,
          bonus: form.bonus,
          thr: 0,
          tantiem: line?.tantiem ?? 0,
          zakat: line?.zakat ?? 0,
          penguranganGaji: Math.max(0, form.penguranganGaji),
        },
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {onYearChange ? <YearSelect value={tahun} onChange={onYearChange} /> : null}
        {onMonthChange
          ? MONTHS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onMonthChange(m.id)}
                className={cn(
                  "h-9 rounded-full px-3 text-sm font-semibold transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  m.id === bulan ? "bg-accent text-accent-fg" : "bg-computed text-muted hover:bg-accent-soft",
                )}
              >
                {m.short}
              </button>
            ))
          : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button onClick={openAdd}>
            <Plus className="size-4" />
            Tambah gaji
          </Button>
          <Select value={String(copyFromYear)} onChange={(e) => setCopyFromYear(Number(e.target.value))}>
            {yearOptions(tahun).map((y) => (
              <option key={y} value={y}>
                Dari {y}
              </option>
            ))}
          </Select>
          <Select value={String(copyFrom)} onChange={(e) => setCopyFrom(Number(e.target.value))}>
            {MONTHS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              copy.mutate({
                data: { tahun, fromTahun: copyFromYear, fromBulan: copyFrom, toBulan: bulan },
              })
            }
          >
            Salin gaji
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Karyawan bergaji" value={String(rows.length)} />
        <Stat label="Bruto bulan ini" value={formatRp(totalBruto)} />
        <Stat label="PPh 21 terutang" value={formatRp(totalPph)} />
      </div>

      {rows.length === 0 ? (
        <div className="glass rounded-[24px] px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            Belum ada gaji {MONTHS.find((m) => m.id === bulan)?.label} {tahun}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Pilih tahun pajak, lalu isi gaji. Lembur diinput di popup; di rekapan digabung ke kolom
            tunjangan.
          </p>
          <Button className="mt-5" onClick={openAdd}>
            <Plus className="size-4" />
            Tambah gaji
          </Button>
        </div>
      ) : (
        <div>
          <VirtualSheet
            count={paged.rows.length}
            rowHeight={56}
            minWidth="1180px"
            header={
              <tr>
                <th className="sticky left-0 z-10 px-3 py-2">Nama</th>
                <th className="px-3 py-2">PTKP</th>
                <th className="px-3 py-2">Gaji</th>
                <th className="px-3 py-2">Tunjangan</th>
                <th className="px-3 py-2">Honor</th>
                <th className="px-3 py-2">Bonus / THR</th>
                <th className="px-3 py-2">Premi</th>
                <th className="px-3 py-2">Tunj. PPh</th>
                <th className="px-3 py-2">Bruto</th>
                <th className="px-3 py-2">TER</th>
                <th className="px-3 py-2">PPh 21</th>
                <th className="px-3 py-2" />
              </tr>
            }
            renderRow={(i) => {
              const row = paged.rows[i];
              if (!row) return null;
              const { emp, line, calc, tunjanganRecap } = row;
              const editable = canAddSalary(emp, bulan);
              return (
                <tr key={`${emp.id}-${tahun}-${bulan}`} className="hover:bg-accent-soft/40">
                  <td className="sticky left-0 z-10 bg-elevated px-3 py-1.5 font-medium">
                    <div>{emp.nama}</div>
                    <div className="text-[11px] text-muted">{emp.jabatan}</div>
                  </td>
                  <td className="px-3 py-1.5 tabular-nums">{emp.ptkp}</td>
                  <td className="px-3 py-1.5 tabular-nums">
                    {formatRp(gajiDibayar(line.gaji, line.penguranganGaji))}
                    {line.penguranganGaji ? (
                      <div className="text-[11px] text-muted">
                        potongan {formatRp(line.penguranganGaji)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums">
                    {formatRp(tunjanganRecap)}
                    {line.uangLembur ? (
                      <div className="text-[11px] text-muted">termasuk lembur {formatRp(line.uangLembur)}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums">{formatRp(line.honorarium)}</td>
                  <td className="px-3 py-1.5 tabular-nums">{formatRp(line.bonus + line.thr)}</td>
                  <td className="cell-computed px-3 py-1.5 tabular-nums">{formatRp(calc.premi.totalAddBruto)}</td>
                  <td className="cell-computed px-3 py-1.5 tabular-nums">{formatRp(calc.tunjanganPph)}</td>
                  <td className="cell-computed px-3 py-1.5 tabular-nums font-semibold">{formatRp(calc.bruto)}</td>
                  <td className="px-3 py-1.5 text-xs">
                    {calc.kategoriTer}
                    <div className="tabular-nums text-muted">{formatPct(calc.tarifTer)}</div>
                  </td>
                  <td className="px-3 py-1.5 tabular-nums font-semibold text-ink">{formatRp(calc.pph)}</td>
                  <td className="px-2 py-1.5">
                    {editable ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(emp, line)}>
                          <Pencil className="size-3.5" />
                          Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove.mutate({ data: { tahun, bulan, employeeId: emp.id } })}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="px-2 text-[11px] font-medium text-muted">Resign</span>
                    )}
                  </td>
                </tr>
              );
            }}
          />
          <TablePager
            total={paged.total}
            page={paged.page}
            pages={paged.pages}
            from={paged.from}
            to={paged.to}
            pageSize={paged.pageSize}
            onPage={paged.setPage}
            onPageSize={paged.setPageSize}
          />
        </div>
      )}
      <p className="text-xs text-muted">
        Gaji tersimpan per tahun dan bulan. Kolom tunjangan di rekapan = tunjangan + lembur. Pengurangan
        disiplin / masuk tengah bulan memotong gaji pokok.
      </p>

      <GlassModal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Ubah gaji" : "Tambah gaji"}
        description={`Masa ${MONTHS.find((m) => m.id === bulan)?.label} ${tahun}. Gaji dan tunjangan terisi dari data karyawan.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Karyawan" className="sm:col-span-2">
            {editingId ? (
              <InputLocked value={selected?.nama ?? ""} />
            ) : (
              <Select
                value={form.employeeId === "" ? "" : String(form.employeeId)}
                onChange={(e) => pickEmployee(Number(e.target.value))}
              >
                {available.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nama}
                    {e.jabatan ? ` — ${e.jabatan}` : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Tahun pajak">
            <InputLocked value={String(tahun)} />
          </Field>
          <Field label="Bulan">
            <InputLocked value={MONTHS.find((m) => m.id === bulan)?.label ?? String(bulan)} />
          </Field>
          <Field label="Gaji" hint="Dasar dari master karyawan">
            <MoneyInput value={form.gaji} onChange={(gaji) => setForm({ ...form, gaji })} />
          </Field>
          <Field
            label="Pengurangan gaji"
            hint="Kurang disiplin atau masuk di tengah bulan — memotong gaji pokok"
          >
            <MoneyInput
              value={form.penguranganGaji}
              onChange={(penguranganGaji) => setForm({ ...form, penguranganGaji })}
            />
          </Field>
          <Field label="Tunjangan" hint="Dasar dari master karyawan">
            <MoneyInput
              value={form.tunjangan}
              onChange={(tunjangan) => setForm({ ...form, tunjangan })}
            />
          </Field>
          <Field label="Lembur" hint="Di rekapan digabung ke tunjangan">
            <MoneyInput
              value={form.uangLembur}
              onChange={(uangLembur) => setForm({ ...form, uangLembur })}
            />
          </Field>
          <Field label="Honor">
            <MoneyInput
              value={form.honorarium}
              onChange={(honorarium) => setForm({ ...form, honorarium })}
            />
          </Field>
          <Field label="Bonus / THR" className="sm:col-span-2">
            <MoneyInput value={form.bonus} onChange={(bonus) => setForm({ ...form, bonus })} />
          </Field>
        </div>

        {preview ? (
          <div className="glass-dark mt-4 grid grid-cols-2 gap-3 rounded-[20px] px-4 py-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Gaji diterima
              </p>
              <p className="mt-1 tabular-nums">{formatRp(gajiDibayar(form.gaji, form.penguranganGaji))}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Tunjangan rekapan
              </p>
              <p className="mt-1 tabular-nums">{formatRp(form.tunjangan + form.uangLembur)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">Bruto</p>
              <p className="mt-1 tabular-nums">{formatRp(preview.bruto)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">PPh 21</p>
              <p className="mt-1 tabular-nums">{formatRp(preview.pph)}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            Simpan gaji
          </Button>
        </div>
      </GlassModal>
    </div>
  );
}

function InputLocked({ value }: { value: string }) {
  return (
    <div className="flex h-11 items-center rounded-[14px] border border-white/55 bg-white/35 px-3 text-[15px] font-medium">
      {value}
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
