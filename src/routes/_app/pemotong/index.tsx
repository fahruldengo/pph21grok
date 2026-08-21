import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { saveCompany } from "@/lib/server/pph";
import { useWorkspace } from "@/lib/pph/use-workspace";

export const Route = createFileRoute("/_app/pemotong/")({ component: PemotongPage });

function PemotongPage() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nama: "",
    npwp: "",
    alamat: "",
    kota: "",
    nitku: "",
    namaPemotong: "",
    npwpPemotong: "",
    tahunPajak: 2026,
  });

  useEffect(() => {
    if (!ws.data) return;
    const c = ws.data.company;
    setForm({
      nama: c.nama,
      npwp: c.npwp,
      alamat: c.alamat,
      kota: c.kota,
      nitku: c.nitku,
      namaPemotong: c.namaPemotong,
      npwpPemotong: c.npwpPemotong,
      tahunPajak: c.tahunPajak,
    });
  }, [ws.data]);

  const save = useMutation({
    mutationFn: saveCompany,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Identitas pemotong disimpan");
    },
  });

  return (
    <div>
      <PageHeader
        kicker="Sheet PEMOTONG"
        title="Identitas pemotong pajak"
        description="Data pemberi kerja yang muncul di bukti potong, BPMP, dan header kalkulator."
        actions={
          <Button onClick={() => save.mutate({ data: form })} disabled={save.isPending}>
            Simpan
          </Button>
        }
      />
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama perusahaan">
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </Field>
          <Field label="NPWP perusahaan">
            <Input value={form.npwp} onChange={(e) => setForm({ ...form, npwp: e.target.value })} />
          </Field>
          <Field label="Alamat" className="sm:col-span-2">
            <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
          </Field>
          <Field label="Kota">
            <Input value={form.kota} onChange={(e) => setForm({ ...form, kota: e.target.value })} />
          </Field>
          <Field label="NITKU / ID TKU">
            <Input value={form.nitku} onChange={(e) => setForm({ ...form, nitku: e.target.value })} />
          </Field>
          <Field label="Nama pemotong">
            <Input
              value={form.namaPemotong}
              onChange={(e) => setForm({ ...form, namaPemotong: e.target.value })}
            />
          </Field>
          <Field label="NPWP pemotong">
            <Input
              value={form.npwpPemotong}
              onChange={(e) => setForm({ ...form, npwpPemotong: e.target.value })}
            />
          </Field>
          <Field label="Tahun pajak">
            <Input
              type="number"
              value={form.tahunPajak}
              onChange={(e) => setForm({ ...form, tahunPajak: Number(e.target.value) || 2026 })}
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}
