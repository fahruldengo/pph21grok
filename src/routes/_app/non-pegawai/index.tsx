import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { calculateNonPermanent } from "@/lib/pph/calculate";
import { formatPct, formatRp, MONTHS } from "@/lib/pph/format";
import { OBJEK_PAJAK } from "@/lib/pph/objek-pajak";
import { PTKP_STATUSES } from "@/lib/pph/ptkp";
import { deleteNonPermanent, listNonPermanent, saveNonPermanent } from "@/lib/server/pph";
import { useWorkspace } from "@/lib/pph/use-workspace";

export const Route = createFileRoute("/_app/non-pegawai/")({ component: NonPegawaiPage });

function NonPegawaiPage() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["nonperm"], queryFn: () => listNonPermanent() });
  const [form, setForm] = useState({
    nama: "",
    nik: "",
    ptkp: "TK/0",
    kodeObjekPajak: "21-100-20",
    penghasilan: 500000,
    masa: 12,
    tahun: ws.data?.company.tahunPajak ?? 2026,
    jenisDokumen: "Contract",
    nomorDokumen: "1",
  });

  const save = useMutation({
    mutationFn: saveNonPermanent,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["nonperm"] });
      toast.success("Transaksi disimpan");
    },
  });
  const del = useMutation({
    mutationFn: deleteNonPermanent,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["nonperm"] });
    },
  });

  const preview = calculateNonPermanent({
    kodeObjekPajak: form.kodeObjekPajak,
    ptkp: form.ptkp,
    penghasilan: form.penghasilan,
    punyaNpwp: true,
  });

  return (
    <div>
      <PageHeader
        kicker="Sheet BP21 NON PEGAWAI TETAP"
        title="Bukan pegawai tetap"
        description="Honor, jasa, tenaga ahli, harian, pesangon. DPP = penghasilan × deemed (50% atau 100%) sesuai kode objek pajak."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <div className="grid gap-3">
            <Field label="Nama">
              <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </Field>
            <Field label="NIK">
              <Input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} />
            </Field>
            <Field label="Kode objek pajak">
              <Select
                value={form.kodeObjekPajak}
                onChange={(e) => setForm({ ...form, kodeObjekPajak: e.target.value })}
              >
                {OBJEK_PAJAK.map((o) => (
                  <option key={o.kode} value={o.kode}>
                    {o.kode} — {o.nama.slice(0, 48)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="PTKP">
              <Select value={form.ptkp} onChange={(e) => setForm({ ...form, ptkp: e.target.value })}>
                {PTKP_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Penghasilan">
              <Input
                type="number"
                value={form.penghasilan}
                onChange={(e) => setForm({ ...form, penghasilan: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Masa">
              <Select value={String(form.masa)} onChange={(e) => setForm({ ...form, masa: Number(e.target.value) })}>
                {MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={() => save.mutate({ data: form })}>Simpan transaksi</Button>
          </div>
          <div className="mt-4 rounded-[16px] bg-computed p-4 text-sm">
            <p>Deemed {preview.deemed}% · DPP {formatRp(preview.dpp)}</p>
            <p className="mt-1 font-semibold">PPh 21 {formatRp(preview.pph)} ({formatPct(preview.tarif)})</p>
          </div>
        </Card>
        <div className="lg:col-span-3 overflow-auto rounded-[20px] border border-border bg-elevated">
          <table className="sheet-grid w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Kode</th>
                <th className="px-3 py-2">Penghasilan</th>
                <th className="px-3 py-2">PPh</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).map((r) => {
                const c = calculateNonPermanent({
                  kodeObjekPajak: r.kodeObjekPajak,
                  ptkp: r.ptkp,
                  penghasilan: r.penghasilan,
                  punyaNpwp: true,
                });
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-2">{r.nama}</td>
                    <td className="px-3 py-2">{r.kodeObjekPajak}</td>
                    <td className="px-3 py-2 tabular-nums">{formatRp(r.penghasilan, false)}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{formatRp(c.pph, false)}</td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="ghost" onClick={() => del.mutate({ data: { id: r.id } })}>
                        Hapus
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
