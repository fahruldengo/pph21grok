import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { YearSelect } from "@/components/pph/year-select";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { calculateMonthly } from "@/lib/pph/calculate";
import { formatPct, formatRp, MONTHS, terbilang } from "@/lib/pph/format";
import { gajiDibayar } from "@/lib/pph/types";
import { PTKP_STATUSES } from "@/lib/pph/ptkp";
import { useTaxYear } from "@/lib/pph/tax-year";
import { useWorkspace, useYearPayroll } from "@/lib/pph/use-workspace";

export const Route = createFileRoute("/_app/kalkulator/")({ component: KalkulatorPage });

function KalkulatorPage() {
  const ws = useWorkspace();
  const { tahun, setTahun } = useTaxYear(ws.data?.company.tahunPajak ?? 2026);
  const pay = useYearPayroll(tahun);
  const [nama, setNama] = useState("");
  const [ptkp, setPtkp] = useState("TK/0");
  const [grossUp, setGrossUp] = useState("Yes");
  const [npwp, setNpwp] = useState("YA");
  const [gaji, setGaji] = useState(0);
  const [tunjangan, setTunjangan] = useState(0);
  const [honor, setHonor] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [thr, setThr] = useState(0);


  const elements = ws.data?.elements;
  const result = useMemo(
    () =>
      calculateMonthly(
        {
          gaji,
          tunjangan,
          honorarium: honor,
          uangMakan: 0,
          uangLembur: 0,
          penghasilanLain: 0,
          natura: 0,
          bonus,
          thr,
          tantiem: 0,
          zakat: 0,
          ptkp,
          grossUp: grossUp === "Yes",
          punyaNpwp: npwp === "YA",
        },
        elements,
        { roundPph: "down" },
      ),
    [gaji, tunjangan, honor, bonus, thr, ptkp, grossUp, npwp, elements],
  );

  function load(id: string) {
    const emp = ws.data?.employees.find((e) => String(e.id) === id);
    if (!emp) return;
    setNama(emp.nama);
    setPtkp(emp.ptkp);
    setGrossUp(emp.grossUp ? "Yes" : "No");
    setNpwp(emp.punyaNpwp ? "YA" : "TIDAK");
    const line =
      pay.data?.find((l) => l.employeeId === emp.id && l.bulan === 1) ??
      pay.data?.find((l) => l.employeeId === emp.id);
    if (line) {
      setGaji(gajiDibayar(line.gaji, line.penguranganGaji));
      setTunjangan(line.tunjangan);
      setHonor(line.honorarium);
      setBonus(line.bonus);
      setThr(line.thr);
    } else {
      setGaji(emp.gaji);
      setTunjangan(emp.tunjangan);
      setHonor(0);
      setBonus(0);
      setThr(0);
    }
  }


  return (
    <div>
      <PageHeader
        kicker={`Sheet KALKULATOR PPH 21 · ${tahun}`}
        title="Kalkulator seorang karyawan"
        description="Rumus mengikuti workbook: premi dari gaji pokok, TER sesuai PTKP, PPh dibulatkan ke bawah."
        actions={<YearSelect value={tahun} onChange={setTahun} />}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Identitas & penghasilan</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Muat dari karyawan" className="sm:col-span-2">
              <Select defaultValue="" onChange={(e) => load(e.target.value)}>
                <option value="">— pilih —</option>
                {(ws.data?.employees ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nama}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nama">
              <Input value={nama} onChange={(e) => setNama(e.target.value)} />
            </Field>
            <Field label="Masa">
              <Select defaultValue="1">
                {MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status PTKP">
              <Select value={ptkp} onChange={(e) => setPtkp(e.target.value)}>
                {PTKP_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Gross-up">
              <Select value={grossUp} onChange={(e) => setGrossUp(e.target.value)}>
                <option>Yes</option>
                <option>No</option>
              </Select>
            </Field>
            <Field label="Punya NPWP">
              <Select value={npwp} onChange={(e) => setNpwp(e.target.value)}>
                <option>YA</option>
                <option>TIDAK</option>
              </Select>
            </Field>
            <Field label="Gaji pokok">
              <Input type="number" value={gaji} onChange={(e) => setGaji(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Tunjangan">
              <Input type="number" value={tunjangan} onChange={(e) => setTunjangan(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Honorarium">
              <Input type="number" value={honor} onChange={(e) => setHonor(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Bonus">
              <Input type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value) || 0)} />
            </Field>
            <Field label="THR">
              <Input type="number" value={thr} onChange={(e) => setThr(Number(e.target.value) || 0)} />
            </Field>
          </div>
        </Card>

        <Card className="glass-dark border-0 text-white">
          <p className="relative z-10 text-[13px] font-medium text-white/65">PPh Pasal 21 terutang</p>
          <p className="relative z-10 mt-3 font-display text-4xl font-semibold tabular-nums tracking-tight">{formatRp(result.pph)}</p>
          <p className="relative z-10 mt-2 text-sm text-white/70">{terbilang(result.pph)}</p>
          <dl className="relative z-10 mt-6 grid grid-cols-2 gap-3 text-sm">
            <Row k="Premi JKK" v={formatRp(result.premi.jkk)} />
            <Row k="Premi JKM" v={formatRp(result.premi.jkm)} />
            <Row k="Premi BPJS Kes" v={formatRp(result.premi.kes)} />
            <Row k="Tunjangan PPh" v={formatRp(result.tunjanganPph)} />
            <Row k="Bruto sebulan" v={formatRp(result.bruto)} />
            <Row k="Kategori TER" v={result.kategoriTer} />
            <Row k="Tarif TER" v={formatPct(result.tarifTer)} />
            <Row k="Iuran JHT+JP" v={formatRp(result.iuranPensiun)} />
            <Row k="Perkiraan take-home" v={formatRp(result.takeHome)} />
          </dl>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-[14px] bg-white/5 px-3 py-2">
      <dt className="text-[11px] text-white/50">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
