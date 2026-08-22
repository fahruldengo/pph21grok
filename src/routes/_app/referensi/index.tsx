import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/app-shell";
import { VirtualSheet } from "@/components/pph/virtual-sheet";
import { Card } from "@/components/ui/card";
import { formatPct, formatRp } from "@/lib/pph/format";
import { OBJEK_PAJAK } from "@/lib/pph/objek-pajak";
import { PASAL_17_BRACKETS } from "@/lib/pph/calculate";
import { PTKP_LABELS, PTKP_YEARLY } from "@/lib/pph/ptkp";
import { TER_A, TER_B, TER_C, type TerBracket } from "@/lib/pph/ter";

export const Route = createFileRoute("/_app/referensi/")({ component: ReferensiPage });

function ReferensiPage() {
  return (
    <div>
      <PageHeader
        kicker="Sheet TER · T-PTKP · REF"
        title="Referensi tarif"
        description="Tabel resmi yang dipakai rumus: PTKP, TER A/B/C (PP 58/2023), Pasal 17, dan daftar objek pajak."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">PTKP</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {Object.entries(PTKP_YEARLY)
                .filter(([k]) => !k.startsWith("HB"))
                .map(([k, v]) => (
                  <tr key={k} className="border-t border-border">
                    <td className="py-2 font-semibold">{k}</td>
                    <td className="py-2 text-muted">{PTKP_LABELS[k]}</td>
                    <td className="py-2 text-right tabular-nums">{formatRp(v)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Pasal 17</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {PASAL_17_BRACKETS.map((b) => (
                <tr key={b.label} className="border-t border-border">
                  <td className="py-2">{b.label}</td>
                  <td className="py-2 text-right tabular-nums font-semibold">{formatPct(b.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <TerCard title="TER A — TK/0, TK/1, K/0" rows={TER_A} />
        <TerCard title="TER B — TK/2–3, K/1–2" rows={TER_B} />
        <TerCard title="TER C — K/3" rows={TER_C} />
      </div>
      <Card className="mt-4">
        <h2 className="font-display text-xl">Daftar objek pajak</h2>
        <div className="mt-3">
          <VirtualSheet
            count={OBJEK_PAJAK.length}
            rowHeight={44}
            minWidth="720px"
            maxHeight="min(52vh, 520px)"
            header={
              <tr>
                <th className="px-3 py-2">Kode</th>
                <th className="px-3 py-2">Uraian</th>
                <th className="px-3 py-2">Deemed</th>
                <th className="px-3 py-2">Tarif</th>
                <th className="px-3 py-2">Sifat</th>
              </tr>
            }
            renderRow={(i) => {
              const o = OBJEK_PAJAK[i];
              if (!o) return null;
              return (
                <tr key={o.kode}>
                  <td className="px-3 py-2 tabular-nums">{o.kode}</td>
                  <td className="px-3 py-2">{o.nama}</td>
                  <td className="px-3 py-2">{o.deemed}%</td>
                  <td className="px-3 py-2">{String(o.tarif)}</td>
                  <td className="px-3 py-2">{o.sifat}</td>
                </tr>
              );
            }}
          />
        </div>
      </Card>
    </div>
  );
}

function TerCard({ title, rows }: { title: string; rows: TerBracket[] }) {
  return (
    <Card className="max-h-[420px] overflow-auto p-4">
      <h2 className="font-display text-lg">{title}</h2>
      <table className="mt-2 w-full text-xs">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-1.5 text-muted">s.d. {r.max === Infinity ? "∞" : formatRp(r.max, false)}</td>
              <td className="py-1.5 text-right tabular-nums font-semibold">{formatPct(r.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
