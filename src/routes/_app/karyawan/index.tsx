import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, MoneyInput, Select } from "@/components/ui/input";
import { PTKP_STATUSES } from "@/lib/pph/ptkp";
import { terCategory } from "@/lib/pph/ter";
import { formatRp } from "@/lib/pph/format";
import { deleteEmployee, saveEmployee } from "@/lib/server/pph";
import { useWorkspace } from "@/lib/pph/use-workspace";
import type { Employee } from "@/lib/pph/types";

export const Route = createFileRoute("/_app/karyawan/")({ component: KaryawanPage });

const blank = {
  nama: "",
  jenisKelamin: "LAKI-LAKI",
  jabatan: "",
  nik: "",
  npwp: "",
  punyaNpwp: true,
  kodeObjekPajak: "21-100-01",
  ptkp: "TK/0",
  alamat: "",
  karyawanAsing: false,
  negara: "Indonesia",
  bulanMulai: 1,
  bulanAkhir: 12,
  grossUp: true,
  gaji: 0,
  tunjangan: 0,
};

function KaryawanPage() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<(typeof blank & { id?: number }) | null>(null);
  const [q, setQ] = useState("");

  const save = useMutation({
    mutationFn: saveEmployee,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace"] });
      setEditing(null);
      toast.success("Karyawan disimpan");
    },
  });
  const del = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Karyawan dihapus");
    },
  });

  const employees = (ws.data?.employees ?? []).filter((e) =>
    `${e.nama} ${e.nik} ${e.jabatan}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        kicker="Master data"
        title="Karyawan"
        description="Identitas, PTKP, gaji pokok, dan tunjangan. Nilai gaji dan tunjangan menjadi dasar saat menambah gaji bulanan."
        actions={
          <Button onClick={() => setEditing({ ...blank })}>Tambah karyawan</Button>
        }
      />
      <Input
        className="mb-4 max-w-sm"
        placeholder="Cari nama, NIK, jabatan…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {editing ? (
        <Card className="mb-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nama" className="lg:col-span-2">
              <Input value={editing.nama} onChange={(e) => setEditing({ ...editing, nama: e.target.value })} />
            </Field>
            <Field label="Jenis kelamin">
              <Select
                value={editing.jenisKelamin}
                onChange={(e) => setEditing({ ...editing, jenisKelamin: e.target.value })}
              >
                <option>LAKI-LAKI</option>
                <option>PEREMPUAN</option>
              </Select>
            </Field>
            <Field label="Jabatan">
              <Input value={editing.jabatan} onChange={(e) => setEditing({ ...editing, jabatan: e.target.value })} />
            </Field>
            <Field label="NIK">
              <Input value={editing.nik} onChange={(e) => setEditing({ ...editing, nik: e.target.value })} />
            </Field>
            <Field label="NPWP">
              <Input value={editing.npwp} onChange={(e) => setEditing({ ...editing, npwp: e.target.value })} />
            </Field>
            <Field label="PTKP">
              <Select value={editing.ptkp} onChange={(e) => setEditing({ ...editing, ptkp: e.target.value })}>
                {PTKP_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Alamat">
              <Input value={editing.alamat} onChange={(e) => setEditing({ ...editing, alamat: e.target.value })} />
            </Field>
            <Field label="Gaji pokok" hint="Dasar saat tambah gaji">
              <MoneyInput value={editing.gaji} onChange={(gaji) => setEditing({ ...editing, gaji })} />
            </Field>
            <Field label="Tunjangan" hint="Dasar saat tambah gaji">
              <MoneyInput
                value={editing.tunjangan}
                onChange={(tunjangan) => setEditing({ ...editing, tunjangan })}
              />
            </Field>
            <Field label="Bulan mulai">
              <Input
                type="number"
                min={1}
                max={12}
                value={editing.bulanMulai}
                onChange={(e) => setEditing({ ...editing, bulanMulai: Number(e.target.value) })}
              />
            </Field>
            <Field label="Bulan akhir">
              <Input
                type="number"
                min={1}
                max={12}
                value={editing.bulanAkhir}
                onChange={(e) => setEditing({ ...editing, bulanAkhir: Number(e.target.value) })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.grossUp}
                onChange={(e) => setEditing({ ...editing, grossUp: e.target.checked })}
              />
              Gross-up
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.punyaNpwp}
                onChange={(e) => setEditing({ ...editing, punyaNpwp: e.target.checked })}
              />
              Punya NPWP
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => save.mutate({ data: editing })}>Simpan</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Batal
            </Button>
          </div>
        </Card>
      ) : null}

      {employees.length === 0 && !editing ? (
        <div className="glass rounded-[24px] px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold text-ink">Belum ada karyawan</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Mulai dari awal: tambah karyawan beserta gaji pokok dan tunjangan, lalu isi gaji bulanan
            dari menu Penghasilan.
          </p>
          <Button className="mt-5" onClick={() => setEditing({ ...blank })}>
            Tambah karyawan
          </Button>
        </div>
      ) : (
        <div className="overflow-auto rounded-[20px] border border-border bg-elevated">
          <table className="sheet-grid w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Jabatan</th>
                <th className="px-3 py-2">NIK</th>
                <th className="px-3 py-2">PTKP</th>
                <th className="px-3 py-2">Gaji</th>
                <th className="px-3 py-2">Tunjangan</th>
                <th className="px-3 py-2">TER</th>
                <th className="px-3 py-2">Gross-up</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 font-medium">{e.nama}</td>
                  <td className="px-3 py-2 text-muted">{e.jabatan}</td>
                  <td className="px-3 py-2 tabular-nums">{e.nik}</td>
                  <td className="px-3 py-2">{e.ptkp}</td>
                  <td className="px-3 py-2 tabular-nums">{formatRp(e.gaji, false)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatRp(e.tunjangan, false)}</td>
                  <td className="px-3 py-2">{terCategory(e.ptkp)}</td>
                  <td className="px-3 py-2">{e.grossUp ? "Ya" : "Tidak"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(toForm(e))}>
                        Ubah
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => del.mutate({ data: { id: e.id } })}>
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function toForm(e: Employee) {
  return {
    id: e.id,
    nama: e.nama,
    jenisKelamin: e.jenisKelamin,
    jabatan: e.jabatan,
    nik: e.nik,
    npwp: e.npwp,
    punyaNpwp: e.punyaNpwp,
    kodeObjekPajak: e.kodeObjekPajak,
    ptkp: e.ptkp,
    alamat: e.alamat,
    karyawanAsing: e.karyawanAsing,
    negara: e.negara,
    bulanMulai: e.bulanMulai,
    bulanAkhir: e.bulanAkhir,
    grossUp: e.grossUp,
    gaji: e.gaji,
    tunjangan: e.tunjangan,
  };
}
