import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/app-shell";
import { TablePager, usePaged } from "@/components/pph/table-pager";
import { VirtualSheet } from "@/components/pph/virtual-sheet";
import { YearSelect } from "@/components/pph/year-select";
import { Badge } from "@/components/ui/card";
import { calculateAnnual, calculateMonthly } from "@/lib/pph/calculate";
import { formatRp } from "@/lib/pph/format";
import { gajiDibayar } from "@/lib/pph/types";
import { useTaxYear } from "@/lib/pph/tax-year";
import { useWorkspace, useYearPayroll } from "@/lib/pph/use-workspace";

export const Route = createFileRoute("/_app/tahunan/")({ component: TahunanPage });

function TahunanPage() {
  const ws = useWorkspace();
  const { tahun, setTahun } = useTaxYear(ws.data?.company.tahunPajak ?? 2026);
  const pay = useYearPayroll(tahun);
  const employees = ws.data?.employees ?? [];
  const elements = ws.data?.elements;
  const lines = pay.data ?? [];

  const rows = employees.map((emp) => {
    const months = lines
      .filter((l) => l.employeeId === emp.id)
      .map((l) => {
        const r = calculateMonthly(
          {
            gaji: gajiDibayar(l.gaji, l.penguranganGaji),
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
          bulan: l.bulan,
          gaji: gajiDibayar(l.gaji, l.penguranganGaji),
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
          pphDipotong: l.bulan === 12 ? 0 : r.pph,
          iuranPensiun: r.iuranPensiun,
        };
      });
    const janNov = months.filter((m) => m.bulan !== 12);
    const monthsWorked = Math.max(1, emp.bulanAkhir - emp.bulanMulai + 1);
    const annual = calculateAnnual(
      {
        ptkp: emp.ptkp,
        grossUp: emp.grossUp,
        punyaNpwp: emp.punyaNpwp,
        jenisPemotongan: emp.bulanMulai === 1 && emp.bulanAkhir === 12 ? "FullYear" : "Annualized",
        monthsWorked,
        pphSebelumnya: 0,
        netoSebelumnya: 0,
        months: janNov.length ? janNov : months,
      },
      elements,
    );
    const desember = annual.pphKurangLebih;
    return { emp, annual, desember };
  });

  const paged = usePaged(rows, "tahunan", 10);

  return (
    <div>
      <PageHeader
        kicker={`Sheet TAHUNAN & DES · ${tahun}`}
        title="Perhitungan setahun / Desember"
        description="Termasuk karyawan resign/separuh tahun. Biaya jabatan 5% (maks. Rp500.000/bulan), iuran pensiun, PTKP, PKP dibulatkan ribuan, tarif Pasal 17. PPh Desember = PPh setahun − TER Januari–November."
        actions={<YearSelect value={tahun} onChange={setTahun} />}
      />
      <VirtualSheet
        count={paged.rows.length}
        rowHeight={56}
        minWidth="1180px"
        header={
          <tr>
            <th className="sticky left-0 z-10 px-3 py-2">Nama</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">PTKP</th>
            <th className="px-3 py-2">Bruto</th>
            <th className="px-3 py-2">Biaya jabatan</th>
            <th className="px-3 py-2">Neto</th>
            <th className="px-3 py-2">PKP</th>
            <th className="px-3 py-2">PPh setahun</th>
            <th className="px-3 py-2">Sudah dipotong</th>
            <th className="px-3 py-2">Desember</th>
          </tr>
        }
        renderRow={(i) => {
          const row = paged.rows[i];
          if (!row) return null;
          const { emp, annual, desember } = row;
          return (
            <tr key={emp.id}>
              <td className="sticky left-0 z-10 bg-elevated px-3 py-2 font-medium">{emp.nama}</td>
              <td className="px-3 py-2">
                <Badge tone={emp.aktif ? "ok" : "warn"}>{emp.aktif ? "Aktif" : "Resign"}</Badge>
              </td>
              <td className="px-3 py-2">{emp.ptkp}</td>
              <td className="px-3 py-2 tabular-nums">{formatRp(annual.bruto)}</td>
              <td className="px-3 py-2 tabular-nums">{formatRp(annual.biayaJabatan)}</td>
              <td className="px-3 py-2 tabular-nums">{formatRp(annual.netoSetahun)}</td>
              <td className="px-3 py-2 tabular-nums">{formatRp(annual.pkp)}</td>
              <td className="px-3 py-2 tabular-nums font-semibold">{formatRp(annual.pphTerutang)}</td>
              <td className="px-3 py-2 tabular-nums">{formatRp(annual.pphDipotongSebelumnya)}</td>
              <td className="px-3 py-2">
                <Badge tone={desember > 0 ? "warn" : desember < 0 ? "ok" : "neutral"}>
                  {formatRp(desember)}
                </Badge>
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
  );
}
