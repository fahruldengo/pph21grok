import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  CloudUpload,
  Download,
  ExternalLink,
  KeyRound,
  Link2,
  LockKeyhole,
  RefreshCw,
  Sheet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { requestSheetsAccessToken } from "@/lib/sheets/gis";
import {
  exportCsvMonth,
  exportToGoogleSheet,
  getSheetLink,
  importGoogleSheet,
  inspectGoogleSheet,
  saveSheetLink,
} from "@/lib/server/sheets";
import { useWorkspace } from "@/lib/pph/use-workspace";
import { MONTHS } from "@/lib/pph/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/google-sheets/")({ component: GoogleSheetsPage });

type InspectTab = { name: string; rows: number; preview: string[][] };

function errMsg(err: unknown) {
  return err instanceof Error ? err.message : "Terjadi kesalahan";
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function GoogleSheetsPage() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const tahun = ws.data?.company.tahunPajak ?? 2026;
  const linkQ = useQuery({ queryKey: ["sheet-link"], queryFn: () => getSheetLink() });

  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [token, setToken] = useState("");
  const [bulan, setBulan] = useState(1);
  const [tabs, setTabs] = useState<InspectTab[]>([]);
  const [sheetTitle, setSheetTitle] = useState("");

  useEffect(() => {
    const link = linkQ.data;
    if (!link) return;
    setUrl(link.url || (link.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${link.spreadsheetId}` : ""));
    setApiKey(link.apiKey || "");
    setClientId(link.clientId || "");
    if (link.title) setSheetTitle(link.title);
  }, [linkQ.data]);

  const save = useMutation({
    mutationFn: () => saveSheetLink({ data: { url, apiKey, clientId } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["sheet-link"] });
      toast.success("Spreadsheet tertaut");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const inspect = useMutation({
    mutationFn: async () => {
      if (url.trim()) await saveSheetLink({ data: { url, apiKey, clientId } });
      return inspectGoogleSheet({ data: { accessToken: token || undefined } });
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["sheet-link"] });
      setTabs(res.tabs);
      setSheetTitle(res.title);
      toast.success(res.tabs.length ? `${res.tabs.length} tab terbaca` : "Tidak ada tab yang terbaca");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const importing = useMutation({
    mutationFn: async () => {
      if (url.trim()) await saveSheetLink({ data: { url, apiKey, clientId } });
      return importGoogleSheet({ data: { accessToken: token || undefined, tahun } });
    },
    onSuccess: async (res) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["sheet-link"] }),
        qc.invalidateQueries({ queryKey: ["workspace"] }),
        qc.invalidateQueries({ queryKey: ["payroll"] }),
        qc.invalidateQueries({ queryKey: ["payroll-year"] }),
      ]);
      setSheetTitle(res.title);
      toast.success(`Impor ${res.employees} karyawan, ${res.payroll} baris gaji`);
      for (const w of res.warnings) toast.message(w);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const exporting = useMutation({
    mutationFn: () =>
      exportToGoogleSheet({ data: { accessToken: token, tahun, bulan } }),
    onSuccess: (res) => {
      toast.success("Spreadsheet baru dibuat di Google Drive");
      if (res.spreadsheetUrl) window.open(res.spreadsheetUrl, "_blank", "noopener,noreferrer");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const csv = useMutation({
    mutationFn: () => exportCsvMonth({ data: { tahun, bulan } }),
    onSuccess: (res) => {
      downloadFile(res.filename, res.csv);
      toast.success("CSV diunduh");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  async function grantAccess() {
    try {
      if (url.trim()) await saveSheetLink({ data: { url, apiKey, clientId } });
      const t = await requestSheetsAccessToken(clientId);
      setToken(t);
      toast.success("Izin Google Sheets diberikan");
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  const linked = Boolean(linkQ.data?.spreadsheetId);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div>
      <PageHeader
        kicker="Google Sheets API"
        title="Impor dan ekspor buku kerja"
        description="Baca tab PEMOTONG dan JAN–DES dari spreadsheet Google, lalu tulis payroll kembali dengan kolom yang sama seperti Excel."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-[12px] bg-accent text-accent-fg">
              <Sheet className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-xl text-ink">Tautkan spreadsheet</h2>
              <p className="mt-1 text-sm text-muted">
                Bagikan file ke “Siapa saja yang memiliki tautan” (pembaca) agar Pajak21 bisa
                membaca tab tanpa kunci API.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="URL Google Sheet">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                autoComplete="off"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending || !url.trim()}>
                <Link2 className="size-4" />
                {linked ? "Perbarui tautan" : "Hubungkan"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => inspect.mutate()}
                disabled={inspect.isPending || !url.trim()}
              >
                <RefreshCw className={cn("size-4", inspect.isPending && "animate-spin")} />
                Periksa tab
              </Button>
            </div>
            {linked ? (
              <p className="text-xs text-muted">
                ID: <span className="font-mono text-fg">{linkQ.data?.spreadsheetId}</span>
                {linkQ.data?.lastSyncedAt
                  ? ` · terakhir impor ${new Date(linkQ.data.lastSyncedAt).toLocaleString("id-ID")}`
                  : null}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="mt-6 flex min-h-11 w-full items-center justify-between rounded-[12px] border border-border bg-elevated px-3 py-2 text-left"
            onClick={() => setShowKeys((v) => !v)}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4 text-muted" />
              API key & OAuth Client ID
            </span>
            <ChevronDown className={cn("size-4 text-muted transition-transform", showKeys && "rotate-180")} />
          </button>
          {showKeys ? (
            <div className="mt-3 grid gap-4 rounded-[16px] border border-border bg-computed p-4 sm:grid-cols-2">
              <Field label="API key (opsional)">
                <Input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza…"
                  autoComplete="off"
                />
              </Field>
              <Field label="OAuth Client ID (untuk menulis)">
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="….apps.googleusercontent.com"
                  autoComplete="off"
                />
              </Field>
              <p className="text-xs leading-relaxed text-muted sm:col-span-2">
                Login Google di Pajak21 tidak punya lingkup Sheets. Untuk ekspor ke Drive, buat
                OAuth Client ID tipe Web di Google Cloud, aktifkan Google Sheets API, dan daftarkan
                origin <span className="font-mono text-fg">{origin}</span>.
              </p>
              <div className="sm:col-span-2">
                <Button variant="secondary" onClick={() => void grantAccess()} disabled={!clientId.trim()}>
                  <LockKeyhole className="size-4" />
                  {token ? "Izin aktif — perbarui" : "Izinkan Google Sheets"}
                </Button>
                {token ? (
                  <Badge tone="ok" className="ml-2">
                    token siap
                  </Badge>
                ) : null}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Cara kerja</p>
          <ol className="mt-4 space-y-4">
            {[
              {
                n: "1",
                t: "Impor publik",
                d: "Tempel tautan, bagikan sebagai pembaca. Pajak21 membaca tab JAN–DES lewat Sheets API atau tautan publik.",
              },
              {
                n: "2",
                t: "Pemetaan kolom Excel",
                d: "NAMA, NIK, GAJI, TUNJANGAN LAINNYA, HONORARIUM, PTKP, GROSS UP. Kolom TUNJANGAN PPh diabaikan — dihitung ulang.",
              },
              {
                n: "3",
                t: "Ekspor",
                d: "Unduh CSV kapan saja. Buat spreadsheet baru di Drive jika OAuth Client ID sudah diizinkan.",
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-sm text-ink">
                  {s.n}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{s.t}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-ink">Tab terbaca</h2>
              <p className="text-sm text-muted">{sheetTitle || "Periksa tautan untuk melihat nama tab."}</p>
            </div>
            <Button onClick={() => importing.mutate()} disabled={importing.isPending || !url.trim()}>
              <CloudUpload className="size-4" />
              Impor ke Pajak21
            </Button>
          </div>
          {tabs.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {tabs.map((t) => (
                <li key={t.name}>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated px-3 py-1.5 text-xs font-semibold">
                    <Check className="size-3 text-ok" />
                    {t.name}
                    <span className="text-muted">{t.rows} baris</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-[16px] border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              Belum ada pratinjau. Hubungkan sheet lalu pilih Periksa tab.
            </p>
          )}
          {tabs[0]?.preview?.length ? (
            <div className="mt-4 overflow-x-auto rounded-[16px] border border-border">
              <table className="min-w-full text-xs">
                <tbody>
                  {tabs[0].preview.map((row, i) => (
                    <tr key={i} className="border-t border-border first:border-t-0">
                      {row.map((c, j) => (
                        <td key={j} className="max-w-40 truncate px-3 py-2 text-muted">
                          {c || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl text-ink">Ekspor masa pajak</h2>
          <p className="mt-1 text-sm text-muted">Kolom mengikuti sheet bulan pada workbook Excel.</p>
          <div className="mt-4">
            <Field label="Bulan">
              <Select value={String(bulan)} onChange={(e) => setBulan(Number(e.target.value))}>
                {MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="secondary"
              onClick={() => csv.mutate()}
              disabled={csv.isPending}
            >
              <Download className="size-4" />
              Unduh CSV {MONTHS.find((m) => m.id === bulan)?.key}
            </Button>
            <Button
              onClick={() => exporting.mutate()}
              disabled={exporting.isPending || !token}
              title={!token ? "Izinkan Google Sheets terlebih dahulu" : undefined}
            >
              <ExternalLink className="size-4" />
              Buat spreadsheet di Drive
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
