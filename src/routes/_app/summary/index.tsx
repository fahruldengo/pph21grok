import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/app-shell";
import { TablePager, usePaged } from "@/components/pph/table-pager";
import { YearSelect } from "@/components/pph/year-select";
import { Badge } from "@/components/ui/card";
import { calculateAnnual, calculateMonthly } from "@/lib/pph/calculate";
import { formatRp, MONTHS } from "@/lib/pph/format";
import { useTaxYear } from "@/lib/pph/tax-year";
import { useWorkspace, useYearPayroll } from "@/lib/pph/use-workspace";

export const Route = createFileRoute("/_app/summary/")({ component: SummaryPage });

function SummaryPage() {
  const ws = useWorkspace();
  const { tahun, setTahun } = useTaxYear(ws.data?.company.tahunPajak ?? 2026);
  const pay = useYearPayroll(tahun);
  const employees = ws.data?.employees ?? [];
  const elements = ws.data?.elements;
  const lines = pay.data ?? [];

  const rows = employees.map((emp) => {
    const perMonth = MONTHS.map((m) => {
      const line = lines.find((l) => l.employeeId === emp.id && l.bulan === m.id);
      if (!line) return { bruto: 0, pph: 0 };
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
      return { bruto: r.bruto, pph: r.pph, line };
    });
    const monthsForAnnual = perMonth
      .map((x, i) =>
        x.line
          ? {
              gaji: x.line.gaji,
              tunjangan: x.line.tunjangan,
              honorarium: x.line.honorarium,
              uangMakan: x.line.uangMakan,
              uangLembur: x.line.uangLembur,
              penghasilanLain: x.line.penghasilanLain,
              natura: x.line.natura,
              bonus: x.line.bonus,
              thr: x.line.thr,
              tantiem: x.line.tantiem,
              zakat: x.line.zakat,
              pphDipotong: x.pph,
              iuranPensiun: calculateMonthly(
                {
                  gaji: x.line.gaji,
                  tunjangan: x.line.tunjangan,
                  honorarium: x.line.honorarium,
                  uangMakan: x.line.uangMakan,
                  uangLembur: x.line.uangLembur,
                  penghasilanLain: x.line.penghasilanLain,
                  natura: x.line.natura,
                  bonus: x.line.bonus,
                  thr: x.line.thr,
                  tantiem: x.line.tantiem,
                  zakat: x.line.zakat,
                  ptkp: emp.ptkp,
                  grossUp: emp.grossUp,
                  punyaNpwp: emp.punyaNpwp,
                },
                elements,
              ).iuranPensiun,
            }
          : null,
      )
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const annual = calculateAnnual(
      {
        ptkp: emp.ptkp,
        grossUp: emp.grossUp,
        punyaNpwp: emp.punyaNpwp,
        jenisPemotongan: "FullYear",
        monthsWorked: emp.bulanAkhir - emp.bulanMulai + 1,
        pphSebelumnya: 0,
        netoSebelumnya: 0,
        months: monthsForAnnual,
      },
      elements,
    );
    const potong = perMonth.reduce((s, m) => s + m.pph, 0);
    const selisih = annual.pphTerutang - potong;
    return { emp, perMonth, annual, potong, selisih };
  });

  const paged = usePaged(rows, "summary", 10);

  return (
    <div>
      <PageHeader
        kicker={`Sheet SUMMARY · ${tahun}`}
        title="Pemotongan setahun"
        description="Bruto dan PPh per bulan, dibandingkan dengan PPh Pasal 17 pada perhitungan A1."
        actions={<YearSelect value={tahun} onChange={setTahun} />}
      />
      <div className="overflow-auto rounded-[20px] border border-border bg-elevated">
        <table className="sheet-grid w-full min-w-[1400px] text-left text-xs">
          <thead>
            <tr>
              <th className="px-2 py-2">Nama</th>
              {MONTHS.map((m) => (
                <th key={m.id} className="px-2 py-2">
                  PPh {m.short}
                </th>
              ))}
              <th className="px-2 py-2">Jumlah</th>
              <th className="px-2 py-2">A1</th>
              <th className="px-2 py-2">Selisih</th>
            </tr>
          </thead>
          <tbody>
            {paged.rows.map((r) => (
              <tr key={r.emp.id}>
                <td className="px-2 py-2 font-medium">{r.emp.nama}</td>
                {r.perMonth.map((m, i) => (
                  <td key={i} className="px-2 py-2 tabular-nums">
                    {m.pph ? formatRp(m.pph, false) : "—"}
                  </td>
                ))}
                <td className="px-2 py-2 tabular-nums font-semibold">{formatRp(r.potong, false)}</td>
                <td className="px-2 py-2 tabular-nums">{formatRp(r.annual.pphTerutang, false)}</td>
                <td className="px-2 py-2">
                  <Badge tone={r.selisih < 0 ? "ok" : r.selisih > 0 ? "warn" : "neutral"}>
                    {r.selisih === 0 ? "NIHIL" : formatRp(r.selisih)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  );
}
