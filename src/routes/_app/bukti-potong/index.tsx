import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { YearSelect } from "@/components/pph/year-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { calculateMonthly } from "@/lib/pph/calculate";
import { formatPct, formatRp, MONTHS, terbilang } from "@/lib/pph/format";
import { gajiDibayar } from "@/lib/pph/types";
import { useTaxYear } from "@/lib/pph/tax-year";
import { usePayroll, useWorkspace } from "@/lib/pph/use-workspace";

export const Route = createFileRoute("/_app/bukti-potong/")({ component: BuktiPage });

function BuktiPage() {
  const ws = useWorkspace();
  const [bulan, setBulan] = useState(1);
  const [empId, setEmpId] = useState<number | null>(null);
  const { tahun, setTahun } = useTaxYear(ws.data?.company.tahunPajak ?? 2026);
  const pay = usePayroll(tahun, bulan);
  const employees = ws.data?.employees ?? [];
  const emp = employees.find((e) => e.id === empId) ?? employees[0];
  const line = pay.data?.find((l) => l.employeeId === emp?.id);
  const company = ws.data?.company;

  const calc = useMemo(() => {
    if (!emp || !ws.data) return null;
    return calculateMonthly(
      {
        gaji: gajiDibayar(line?.gaji ?? 0, line?.penguranganGaji ?? 0),
        tunjangan: line?.tunjangan ?? 0,
        honorarium: line?.honorarium ?? 0,
        uangMakan: line?.uangMakan ?? 0,
        uangLembur: line?.uangLembur ?? 0,
        penghasilanLain: line?.penghasilanLain ?? 0,
        natura: line?.natura ?? 0,
        bonus: line?.bonus ?? 0,
        thr: line?.thr ?? 0,
        tantiem: line?.tantiem ?? 0,
        zakat: line?.zakat ?? 0,
        ptkp: emp.ptkp,
        grossUp: emp.grossUp,
        punyaNpwp: emp.punyaNpwp,
      },
      ws.data.elements,
    );
  }, [emp, line, ws.data]);

  return (
    <div>
      <PageHeader
        kicker="FORMAT BPMP · A1 · 1721-VII"
        title="Bukti potong"
        description="Pratinjau dokumen pemotongan untuk e-Bupot. Pilih karyawan dan masa pajak, lalu cetak."
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            Cetak / PDF
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <YearSelect value={tahun} onChange={setTahun} />
        <Select value={String(emp?.id ?? "")} onChange={(e) => setEmpId(Number(e.target.value))}>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nama}
            </option>
          ))}
        </Select>
        <Select value={String(bulan)} onChange={(e) => setBulan(Number(e.target.value))}>
          {MONTHS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      {emp && calc && company ? (
        <Card className="mx-auto max-w-3xl print:border-0 print:shadow-none">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            Kementerian Keuangan RI · Direktorat Jenderal Pajak
          </p>
          <h2 className="mt-2 text-center font-display text-2xl">Bukti Pemotongan PPh Pasal 21</h2>
          <p className="text-center text-sm text-muted">
            Masa {MONTHS[bulan - 1]?.label} {tahun} · Kode 21-100-01
          </p>

          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">A. Penerima penghasilan</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <Pair k="Nama" v={emp.nama} />
              <Pair k="NIK / NPWP" v={emp.nik} />
              <Pair k="Status PTKP" v={emp.ptkp} />
              <Pair k="Jabatan" v={emp.jabatan} />
              <Pair k="Alamat" v={emp.alamat} />
              <Pair k="ID TKU" v={`${emp.nik}000000`} />
            </dl>
          </section>

          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">B. PPh yang dipotong</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <Pair k="Penghasilan bruto" v={formatRp(calc.bruto)} />
              <Pair k="Kategori TER" v={calc.kategoriTer} />
              <Pair k="Tarif" v={formatPct(calc.tarifTer)} />
              <Pair k="PPh Pasal 21" v={formatRp(calc.pph)} />
            </dl>
            <p className="mt-3 rounded-[14px] bg-computed px-4 py-3 text-sm">
              Terbilang: {terbilang(calc.pph)}
            </p>
          </section>

          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">C. Identitas pemotong</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <Pair k="Nama" v={company.nama} />
              <Pair k="NPWP" v={company.npwp} />
              <Pair k="Pemotong" v={company.namaPemotong} />
              <Pair k="NPWP pemotong" v={company.npwpPemotong} />
              <Pair k="Alamat" v={`${company.alamat}, ${company.kota}`} />
              <Pair k="NITKU" v={company.nitku} />
            </dl>
          </section>
        </Card>
      ) : null}
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted">{k}</dt>
      <dd className="font-medium">{v || "—"}</dd>
    </div>
  );
}
