import { MONTHS } from "@/lib/pph/format";
import { toCsv } from "@/lib/sheets/csv";
import {
  sheetsApiCreate,
  sheetsApiGet,
  sheetsApiUpdate,
  sheetsApiValues,
  type SheetsApiAuth,
} from "@/lib/sheets/gviz";
import { probeSpreadsheetJsonp } from "@/lib/sheets/jsonp";
import {
  EMPTY_SHEET_LINK,
  buildExportGrid,
  buildImportBundle,
  parseSpreadsheetUrl,
  type SheetGrid,
  type SheetLink,
} from "@/lib/sheets/map";
import { applyImportBundle, snapshotMonth } from "./pph-local";
import { readSession, sheetLinkKey } from "./storage";

type DataArg<T> = { data: T } | T;

function unwrap<T>(input: DataArg<T> | undefined): T {
  if (input && typeof input === "object" && "data" in (input as object)) {
    return (input as { data: T }).data;
  }
  return input as T;
}

function uid() {
  const s = readSession();
  if (!s) throw new Error("Unauthorized");
  return s.id;
}

function loadLink(userId: string): SheetLink {
  try {
    const raw = localStorage.getItem(sheetLinkKey(userId));
    if (!raw) return { ...EMPTY_SHEET_LINK };
    return { ...EMPTY_SHEET_LINK, ...(JSON.parse(raw) as SheetLink) };
  } catch {
    return { ...EMPTY_SHEET_LINK };
  }
}

function saveLink(userId: string, link: SheetLink) {
  localStorage.setItem(sheetLinkKey(userId), JSON.stringify(link));
}

function authFrom(link: SheetLink, accessToken?: string): SheetsApiAuth {
  return { apiKey: link.apiKey || undefined, accessToken: accessToken || undefined };
}

async function loadTabs(spreadsheetId: string, auth: SheetsApiAuth): Promise<{ title: string; tabs: SheetGrid[] }> {
  if (auth.accessToken || auth.apiKey) {
    try {
      const meta = await sheetsApiGet(spreadsheetId, auth);
      const tabs: SheetGrid[] = [];
      for (const sh of meta.sheets) {
        const rows = await sheetsApiValues(spreadsheetId, `'${sh.title.replace(/'/g, "''")}'`, auth);
        if (rows.length) tabs.push({ name: sh.title, rows });
      }
      return { title: meta.title, tabs };
    } catch (err) {
      if (auth.accessToken) throw err;
    }
  }
  return probeSpreadsheetJsonp(spreadsheetId);
}

export async function getSheetLink() {
  return loadLink(uid());
}

export async function saveSheetLink(
  input: DataArg<{ url: string; apiKey?: string; clientId?: string }>,
) {
  const data = unwrap(input);
  const parsed = parseSpreadsheetUrl(data.url);
  if (!parsed) throw new Error("URL Google Sheet tidak dikenali. Tempel tautan lengkap atau ID spreadsheet.");
  const userId = uid();
  const prev = loadLink(userId);
  const next: SheetLink = {
    ...prev,
    spreadsheetId: parsed.spreadsheetId,
    url: data.url,
    apiKey: data.apiKey ?? prev.apiKey,
    clientId: data.clientId ?? prev.clientId,
  };
  saveLink(userId, next);
  return { spreadsheetId: parsed.spreadsheetId };
}

export async function inspectGoogleSheet(input: DataArg<{ accessToken?: string }>) {
  const data = unwrap(input) ?? {};
  const userId = uid();
  const link = loadLink(userId);
  if (!link.spreadsheetId) throw new Error("Hubungkan Google Sheet terlebih dahulu.");
  const result = await loadTabs(link.spreadsheetId, authFrom(link, data.accessToken));
  saveLink(userId, { ...link, title: result.title });
  return {
    title: result.title,
    spreadsheetId: link.spreadsheetId,
    tabs: result.tabs.map((t) => ({
      name: t.name,
      rows: t.rows.length,
      preview: t.rows.slice(0, 4).map((r) => r.slice(0, 6)),
    })),
  };
}

export async function importGoogleSheet(input: DataArg<{ accessToken?: string; tahun: number }>) {
  const data = unwrap(input);
  const userId = uid();
  const link = loadLink(userId);
  if (!link.spreadsheetId) throw new Error("Hubungkan Google Sheet terlebih dahulu.");
  const loaded = await loadTabs(link.spreadsheetId, authFrom(link, data.accessToken));
  const bundle = buildImportBundle(loaded.tabs, data.tahun);
  const applied = applyImportBundle(bundle, data.tahun);
  saveLink(userId, {
    ...link,
    title: loaded.title,
    lastSyncedAt: new Date().toISOString(),
  });
  return {
    title: loaded.title,
    employees: applied.employees,
    payroll: applied.payroll,
    tabs: bundle.tabs,
    warnings: bundle.warnings,
  };
}

export async function exportToGoogleSheet(
  input: DataArg<{ accessToken: string; tahun: number; bulan: number }>,
) {
  const data = unwrap(input);
  if (!data.accessToken) throw new Error("Izin Google Sheets diperlukan untuk menulis ke Drive.");
  const snap = snapshotMonth(data.tahun, data.bulan);
  const nikByEmpId = new Map(snap.employees.map((e) => [e.id, e.nik]));
  const tab = MONTHS.find((m) => m.id === data.bulan)?.key ?? `M${data.bulan}`;
  const grid = buildExportGrid(`${tab} ${data.tahun}`, snap.employees, snap.lines, nikByEmpId);
  const created = await sheetsApiCreate(
    `Pajak21 ${snap.company.nama} ${tab} ${data.tahun}`,
    [tab],
    { accessToken: data.accessToken },
  );
  await sheetsApiUpdate(
    created.spreadsheetId,
    [{ range: `'${tab}'!A1`, values: grid }],
    { accessToken: data.accessToken },
  );
  return { spreadsheetId: created.spreadsheetId, spreadsheetUrl: created.spreadsheetUrl };
}

export async function exportCsvMonth(input: DataArg<{ tahun: number; bulan: number }>) {
  const data = unwrap(input);
  const snap = snapshotMonth(data.tahun, data.bulan);
  const nikByEmpId = new Map(snap.employees.map((e) => [e.id, e.nik]));
  const grid = buildExportGrid(`Masa ${data.bulan}/${data.tahun}`, snap.employees, snap.lines, nikByEmpId);
  return {
    csv: toCsv(grid),
    filename: `pajak21-${data.tahun}-${String(data.bulan).padStart(2, "0")}.csv`,
  };
}
