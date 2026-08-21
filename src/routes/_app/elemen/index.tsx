import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { saveElements } from "@/lib/server/pph";
import { useWorkspace } from "@/lib/pph/use-workspace";
import type { TaxElements } from "@/lib/pph/calculate";
import { DEFAULT_ELEMENTS } from "@/lib/pph/calculate";
import { formatRp } from "@/lib/pph/format";

export const Route = createFileRoute("/_app/elemen/")({ component: ElemenPage });

function pct(v: number) {
  return String(Math.round(v * 10000) / 100);
}
function fromPct(v: string) {
  return (Number(v) || 0) / 100;
}

function ElemenPage() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const [el, setEl] = useState<TaxElements>(DEFAULT_ELEMENTS);

  useEffect(() => {
    if (ws.data) setEl(ws.data.elements);
  }, [ws.data]);

  const save = useMutation({
    mutationFn: saveElements,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Elemen PPh 21 disimpan");
    },
  });

  return (
    <div>
      <PageHeader
        kicker="Sheet ELEMEN PPh 21"
        title="Premi penambah & pengurang"
        description="Persentase mengikuti kebijakan perusahaan. Default sesuai workbook: JKK 0,24%, JKM 0,30%, BPJS Kes 4%/1%, JHT 3,7%/2%, JP 2%/1% dengan plafon."
        actions={<Button onClick={() => save.mutate({ data: el })}>Simpan elemen</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl text-ink">Dibayarkan pemberi kerja</h2>
          <p className="mt-1 text-sm text-muted">
            JKK, JKM, dan BPJS Kesehatan ditambahkan ke penghasilan bruto. JHT/JP pemberi kerja
            default bukan penambah bruto.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="JKK %">
              <Input value={pct(el.jkkEmployer)} onChange={(e) => setEl({ ...el, jkkEmployer: fromPct(e.target.value) })} />
            </Field>
            <Field label="JKM %">
              <Input value={pct(el.jkmEmployer)} onChange={(e) => setEl({ ...el, jkmEmployer: fromPct(e.target.value) })} />
            </Field>
            <Field label="JHT pemberi kerja %">
              <Input value={pct(el.jhtEmployer)} onChange={(e) => setEl({ ...el, jhtEmployer: fromPct(e.target.value) })} />
            </Field>
            <Field label="JP pemberi kerja %">
              <Input value={pct(el.jpEmployer)} onChange={(e) => setEl({ ...el, jpEmployer: fromPct(e.target.value) })} />
            </Field>
            <Field label="BPJS Kesehatan pemberi kerja %">
              <Input value={pct(el.kesEmployer)} onChange={(e) => setEl({ ...el, kesEmployer: fromPct(e.target.value) })} />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={el.jhtEmployerAddBruto}
                onChange={(e) => setEl({ ...el, jhtEmployerAddBruto: e.target.checked })}
              />
              JHT pemberi kerja sebagai penambah bruto
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={el.jpEmployerAddBruto}
                onChange={(e) => setEl({ ...el, jpEmployerAddBruto: e.target.checked })}
              />
              JP pemberi kerja sebagai penambah bruto
            </label>
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-xl text-ink">Iuran karyawan (pengurang)</h2>
          <p className="mt-1 text-sm text-muted">
            JHT 2% dan JP 1% mengurangi penghasilan neto pada perhitungan Desember. Plafon JP{" "}
            {formatRp(el.jpMax)}, BPJS Kes {formatRp(el.kesMax)}.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="JHT karyawan %">
              <Input value={pct(el.jhtEmployee)} onChange={(e) => setEl({ ...el, jhtEmployee: fromPct(e.target.value) })} />
            </Field>
            <Field label="JP karyawan %">
              <Input value={pct(el.jpEmployee)} onChange={(e) => setEl({ ...el, jpEmployee: fromPct(e.target.value) })} />
            </Field>
            <Field label="BPJS Kes karyawan %">
              <Input value={pct(el.kesEmployee)} onChange={(e) => setEl({ ...el, kesEmployee: fromPct(e.target.value) })} />
            </Field>
            <Field label="Plafon JP (Rp)">
              <Input value={el.jpMax} onChange={(e) => setEl({ ...el, jpMax: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Plafon BPJS Kes (Rp)">
              <Input value={el.kesMax} onChange={(e) => setEl({ ...el, kesMax: Number(e.target.value) || 0 })} />
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
}
