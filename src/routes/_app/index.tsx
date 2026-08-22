import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/app-shell";
import { YearSelect } from "@/components/pph/year-select";
import { Card } from "@/components/ui/card";
import { useWorkspace, useYearPayroll } from "@/lib/pph/use-workspace";
import { calculateAnnual, calculateMonthly } from "@/lib/pph/calculate";
import { formatRp, MONTHS } from "@/lib/pph/format";
import { useTaxYear } from "@/lib/pph/tax-year";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

function Dashboard() {
  const ws = useWorkspace();
  const { tahun, setTahun } = useTaxYear(ws.data?.company.tahunPajak ?? 2026);
  const pay = useYearPayroll(tahun);

  if (ws.isLoading || !ws.data) {
    return <div className="glass h-40 animate-pulse rounded-[28px]" />;
  }

  const { company, employees, elements } = ws.data;
  const lines = pay.data ?? [];

  const monthStats = MONTHS.map((m) => {
    let pph = 0;
    let bruto = 0;
    let n = 0;
    for (const emp of employees) {
      const line = lines.find((l) => l.employeeId === emp.id && l.bulan === m.id);
      if (!line) continue;
      n += 1;
      const r = calculateMonthly(
        {
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
          ptkp: emp.ptkp,
          grossUp: emp.grossUp,
          punyaNpwp: emp.punyaNpwp,
        },
        elements,
      );
      pph += r.pph;
      bruto += r.bruto;
    }
    return { bulan: m.short, pph, bruto, n };
  });

  const ytdPph = monthStats.reduce((s, m) => s + m.pph, 0);
  const ytdBruto = monthStats.reduce((s, m) => s + m.bruto, 0);
  const janCount = monthStats[0]?.n ?? 0;
  const aktifCount = employees.filter((e) => e.aktif).length;
  const resignCount = employees.length - aktifCount;

  let annualPph = 0;
  for (const emp of employees) {
    const months = lines
      .filter((l) => l.employeeId === emp.id)
      .map((l) => {
        const r = calculateMonthly(
          {
            gaji: l.gaji,
            tunjangan: l.tunjangan,
            honorarium: l.honorarium,
            uangMakan: l.uangMakan,
            uangLembur: l.uangLembur,
            penghasilanLain: l.penghasilanLain,
            natura: l.natura,
            bonus: l.bonus,
            thr: l.thr,
            tantiem: l.tantiem,
            zakat: l.zakat,
            ptkp: emp.ptkp,
            grossUp: emp.grossUp,
            punyaNpwp: emp.punyaNpwp,
          },
          elements,
        );
        return {
          gaji: l.gaji,
          tunjangan: l.tunjangan,
          honorarium: l.honorarium,
          uangMakan: l.uangMakan,
          uangLembur: l.uangLembur,
          penghasilanLain: l.penghasilanLain,
          natura: l.natura,
          bonus: l.bonus,
          thr: l.thr,
          tantiem: l.tantiem,
          zakat: l.zakat,
          pphDipotong: r.pph,
          iuranPensiun: r.iuranPensiun,
        };
      });
    if (!months.length) continue;
    const a = calculateAnnual(
      {
        ptkp: emp.ptkp,
        grossUp: emp.grossUp,
        punyaNpwp: emp.punyaNpwp,
        jenisPemotongan: "FullYear",
        monthsWorked: emp.bulanAkhir - emp.bulanMulai + 1,
        pphSebelumnya: 0,
        netoSebelumnya: 0,
        months,
      },
      elements,
    );
    annualPph += a.pphTerutang;
  }

  return (
    <div className="relative z-10">
      <PageHeader
        kicker={company.nama}
        title="Ringkasan pemotongan"
        description={`Tahun pajak ${tahun}. Ganti tahun untuk melihat arsip gaji dan PPh jangka panjang.`}
        actions={<YearSelect value={tahun} onChange={setTahun} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Karyawan aktif"
          value={String(aktifCount)}
          hint={
            resignCount
              ? `${resignCount} resign tetap di laporan tahunan`
              : `${janCount} ada gaji Januari`
          }
        />
        <Metric label="Bruto YTD" value={formatRp(ytdBruto)} hint="Jumlah penghasilan bruto terhitung" />
        <Metric label="PPh 21 YTD (TER)" value={formatRp(ytdPph)} hint="Akumulasi pemotongan bulanan" />
        <Metric label="PPh Pasal 17 tahunan" value={formatRp(annualPph)} hint="Rekonsiliasi A1 / Desember" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <p className="relative z-10 text-[13px] font-medium text-muted">PPh 21 per bulan</p>
          <div className="relative z-10 mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthStats}>
                <XAxis dataKey="bulan" tick={{ fill: "#636366", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#636366", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}rb`}
                />
                <Tooltip
                  formatter={(v) => formatRp(Number(v))}
                  contentStyle={{
                    background: "rgba(255,255,255,0.78)",
                    border: "1px solid rgba(255,255,255,0.7)",
                    borderRadius: 16,
                    backdropFilter: "blur(16px)",
                  }}
                />
                <Bar dataKey="pph" fill="#007aff" radius={[8, 8, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <p className="relative z-10 text-[13px] font-medium text-muted">Lanjut kerja</p>
          <ul className="relative z-10 mt-4 space-y-2">
            {[
              { to: "/penghasilan", title: "Isi penghasilan bulan berjalan", sub: "Popup gaji + lembur" },
              { to: "/kalkulator", title: "Uji TER seorang karyawan", sub: "Kalkulator PPh 21" },
              { to: "/tahunan", title: "Hitung Desember / A1", sub: "Pasal 17 minus TER YTD" },
              { to: "/bukti-potong", title: "Siapkan bukti potong", sub: "BPMP, A1, BP21" },
            ].map((x) => (
              <li key={x.to}>
                <Link
                  to={x.to}
                  className="flex items-center justify-between rounded-[18px] border border-white/50 bg-white/35 px-4 py-3 transition-[background-color] duration-150 hover:bg-white/55"
                >
                  <span>
                    <span className="block text-sm font-semibold">{x.title}</span>
                    <span className="text-xs text-muted">{x.sub}</span>
                  </span>
                  <ArrowUpRight className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="relative z-10 text-[13px] font-medium text-muted">{label}</p>
      <p className="relative z-10 mt-2 font-display text-[28px] font-semibold tabular-nums tracking-tight text-ink sm:text-[32px]">
        {value}
      </p>
      <p className="relative z-10 mt-1 text-xs text-subtle">{hint}</p>
    </Card>
  );
}
