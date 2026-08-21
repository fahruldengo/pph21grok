import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { useWorkspace, useYearPayroll } from "@/lib/pph/use-workspace";
import { calculateAnnual, calculateMonthly } from "@/lib/pph/calculate";
import { formatRp, MONTHS } from "@/lib/pph/format";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

function Dashboard() {
  const ws = useWorkspace();
  const year = ws.data?.company.tahunPajak ?? 2026;
  const pay = useYearPayroll(year);

  if (ws.isLoading || !ws.data) {
    return <div className="h-40 animate-pulse rounded-[24px] bg-surface" />;
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
    <div>
      <PageHeader
        kicker={company.nama}
        title="Ringkasan pemotongan"
        description={`Tahun pajak ${year}. Data awal mengikuti workbook Excel CV. Vidya Amaliah — 55 karyawan, TER, dan elemen BPJS.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Karyawan aktif" value={String(employees.length)} hint={`${janCount} ada gaji Januari`} />
        <Metric label="Bruto YTD" value={formatRp(ytdBruto)} hint="Jumlah penghasilan bruto terhitung" />
        <Metric label="PPh 21 YTD (TER)" value={formatRp(ytdPph)} hint="Akumulasi pemotongan bulanan" />
        <Metric label="PPh Pasal 17 tahunan" value={formatRp(annualPph)} hint="Rekonsiliasi A1 / Desember" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">PPh 21 per bulan</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthStats}>
                <XAxis dataKey="bulan" tick={{ fill: "#6d675e", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#6d675e", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}rb`}
                />
                <Tooltip
                  formatter={(v) => formatRp(Number(v))}
                  contentStyle={{ background: "#fbf8f2", border: "1px solid #ddd6c8", borderRadius: 12 }}
                />
                <Bar dataKey="pph" fill="#21564b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Lanjut kerja</p>
          <ul className="mt-4 space-y-2">
            {[
              { to: "/penghasilan", title: "Isi penghasilan bulan berjalan", sub: "Spreadsheet biru/hijau" },
              { to: "/google-sheets", title: "Impor dari Google Sheets", sub: "Tab JAN–DES sesuai Excel" },
              { to: "/kalkulator", title: "Uji TER seorang karyawan", sub: "Kalkulator PPh 21" },
              { to: "/tahunan", title: "Hitung Desember / A1", sub: "Pasal 17 minus TER YTD" },
              { to: "/bukti-potong", title: "Siapkan bukti potong", sub: "BPMP, A1, BP21" },
            ].map((x) => (
              <li key={x.to}>
                <Link
                  to={x.to}
                  className="flex items-center justify-between rounded-[16px] border border-border bg-elevated px-4 py-3 hover:border-accent"
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl tabular-nums text-ink sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-subtle">{hint}</p>
    </Card>
  );
}
