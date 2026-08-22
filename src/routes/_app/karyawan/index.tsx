import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { TablePager, usePaged } from "@/components/pph/table-pager";
import { VirtualSheet } from "@/components/pph/virtual-sheet";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, Input, MoneyInput, Select } from "@/components/ui/input";
import { PTKP_STATUSES } from "@/lib/pph/ptkp";
import { terCategory } from "@/lib/pph/ter";
import { formatRp, MONTHS } from "@/lib/pph/format";
import { deleteEmployee, saveEmployee } from "@/lib/server/pph";
import { useWorkspace } from "@/lib/pph/use-workspace";
import type { Employee } from "@/lib/pph/types";
import { cn } from "@/lib/utils";

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
  aktif: true,
  gaji: 0,
  tunjangan: 0,
};

type StatusFilter = "all" | "aktif" | "resign";

function KaryawanPage() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<(typeof blank & { id?: number }) | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const save = useMutation({
    mutationFn: saveEmployee,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace"] });
      setEditing(null);
      toast.success("Karyawan disimpan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Karyawan dihapus");
    },
  });

  const employees = (ws.data?.employees ?? []).filter((e) => {
    const hay = `${e.nama} ${e.nik} ${e.jabatan}`.toLowerCase().includes(q.toLowerCase());
    if (!hay) return false;
    if (status === "aktif") return e.aktif;
    if (status === "resign") return !e.aktif;
    return true;
  });
  const paged = usePaged(employees, "karyawan", 10);
  const { resetPage } = paged;

  useEffect(() => {
    resetPage();
  }, [q, status, resetPage]);

  const all = ws.data?.employees ?? [];
  const aktifN = all.filter((e) => e.aktif).length;
  const resignN = all.length - aktifN;

  return (
    <div>
      <PageHeader
        kicker="Master data"
        title="Karyawan"
        description="Identitas, PTKP, gaji pokok, dan tunjangan. Karyawan resign/keluar tidak masuk daftar tambah gaji, tetapi tetap dihitung di Tahunan dan Summary sebagai pekerja separuh tahun."
        actions={
          <Button onClick={() => setEditing({ ...blank })}>Tambah karyawan</Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          className="max-w-sm"
          placeholder="Cari nama, NIK, jabatan…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all", label: `Semua (${all.length})` },
              { id: "aktif", label: `Aktif (${aktifN})` },
              { id: "resign", label: `Resign (${resignN})` },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatus(chip.id)}
              className={cn(
                "h-9 rounded-full px-3 text-sm font-semibold transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                status === chip.id ? "bg-accent text-accent-fg" : "bg-white/40 text-muted hover:bg-white/60",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

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
            <Field label="Status kepegawaian">
              <Select
                value={editing.aktif ? "aktif" : "resign"}
                onChange={(e) => setEditing({ ...editing, aktif: e.target.value === "aktif" })}
              >
                <option value="aktif">Aktif</option>
                <option value="resign">Resign / keluar</option>
              </Select>
            </Field>
            <Field label="Bulan mulai">
              <Select
                value={String(editing.bulanMulai)}
                onChange={(e) => setEditing({ ...editing, bulanMulai: Number(e.target.value) })}
              >
                {MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Bulan akhir"
              hint={
                editing.aktif
                  ? "Biasanya Desember untuk karyawan penuh tahun"
                  : "Bulan kerja terakhir. Tetap dilaporkan tahunan sebagai separuh tahun."
              }
            >
              <Select
                value={String(editing.bulanAkhir)}
                onChange={(e) => setEditing({ ...editing, bulanAkhir: Number(e.target.value) })}
              >
                {MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
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
          {!editing.aktif ? (
            <p className="mt-3 rounded-[16px] bg-warn/10 px-3 py-2 text-sm text-muted">
              Resign tidak muncul di daftar tambah gaji bulan berjalan. Gaji yang sudah diisi tetap masuk
              rekapan masa kerjanya, Tahunan, dan Summary.
            </p>
          ) : null}
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
          <p className="font-display text-xl font-semibold text-ink">
            {all.length === 0 ? "Belum ada karyawan" : "Tidak ada yang cocok"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            {all.length === 0
              ? "Mulai dari awal: tambah karyawan beserta gaji pokok dan tunjangan, lalu isi gaji bulanan dari menu Penghasilan."
              : "Ubah kata kunci atau filter status."}
          </p>
          {all.length === 0 ? (
            <Button className="mt-5" onClick={() => setEditing({ ...blank })}>
              Tambah karyawan
            </Button>
          ) : null}
        </div>
      ) : employees.length === 0 ? null : (
        <div>
          <VirtualSheet
            count={paged.rows.length}
            rowHeight={56}
            minWidth="1080px"
            header={
              <tr>
                <th className="sticky left-0 z-10 px-3 py-2">Nama</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Jabatan</th>
                <th className="px-3 py-2">NIK</th>
                <th className="px-3 py-2">PTKP</th>
                <th className="px-3 py-2">Gaji</th>
                <th className="px-3 py-2">Tunjangan</th>
                <th className="px-3 py-2">Masa kerja</th>
                <th className="px-3 py-2">TER</th>
                <th className="px-3 py-2">Gross-up</th>
                <th className="px-3 py-2" />
              </tr>
            }
            renderRow={(i) => {
              const e = paged.rows[i];
              if (!e) return null;
              const mulai = MONTHS.find((m) => m.id === e.bulanMulai)?.short ?? e.bulanMulai;
              const akhir = MONTHS.find((m) => m.id === e.bulanAkhir)?.short ?? e.bulanAkhir;
              return (
                <tr key={e.id} className={cn(!e.aktif && "opacity-80")}>
                  <td className="sticky left-0 z-10 bg-elevated px-3 py-2 font-medium">{e.nama}</td>
                  <td className="px-3 py-2">
                    <Badge tone={e.aktif ? "ok" : "warn"}>{e.aktif ? "Aktif" : "Resign"}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted">{e.jabatan}</td>
                  <td className="px-3 py-2 tabular-nums">{e.nik}</td>
                  <td className="px-3 py-2">{e.ptkp}</td>
                  <td className="px-3 py-2 tabular-nums">{formatRp(e.gaji)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatRp(e.tunjangan)}</td>
                  <td className="px-3 py-2 tabular-nums text-muted">
                    {mulai}–{akhir}
                  </td>
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
    aktif: e.aktif,
    gaji: e.gaji,
    tunjangan: e.tunjangan,
  };
}
