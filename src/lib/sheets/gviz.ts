import { parseCsv } from "./csv";
import { PROBE_TABS, tabFitsName, type SheetGrid } from "./map";

function isHtml(text: string): boolean {
  const t = text.trim().slice(0, 80).toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}

export async function fetchGvizCsv(
  spreadsheetId: string,
  sheet?: string,
  gid?: string,
): Promise<string[][] | null> {
  const params = new URLSearchParams({ tqx: "out:csv" });
  if (gid) params.set("gid", gid);
  else if (sheet) params.set("sheet", sheet);
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`;
  const res = await fetch(url, {
    redirect: "follow",
    headers: { Accept: "text/csv,text/plain,*/*" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  const text = await res.text();
  if (!text || isHtml(text)) return null;
  const rows = parseCsv(text);
  return rows.length ? rows : null;
}

export async function probeSpreadsheet(
  spreadsheetId: string,
  names: string[] = PROBE_TABS,
): Promise<{ title: string; tabs: SheetGrid[] }> {
  const tabs: SheetGrid[] = [];
  const seen = new Set<string>();
  const signatures = new Set<string>();
  const sig = (rows: string[][]) => rows.slice(0, 3).flat().join("|").slice(0, 180);

  let firstRows: string[][] | null = null;
  try {
    firstRows = await fetchGvizCsv(spreadsheetId);
  } catch {
    firstRows = null;
  }
  if (firstRows?.length) {
    signatures.add(sig(firstRows));
    tabs.push({ name: "Sheet1", rows: firstRows });
  }

  const trySheet = async (name: string) => {
    const key = name.toUpperCase();
    if (seen.has(key) || key === "SHEET1") return;
    try {
      const rows = await fetchGvizCsv(spreadsheetId, name);
      if (!rows?.length) return;
      if (!tabFitsName(name, rows)) return;
      const signature = sig(rows);
      if (signatures.has(signature)) {
        const existing = tabs.find((t) => sig(t.rows) === signature);
        if (existing && existing.name === "Sheet1") existing.name = name;
        return;
      }
      seen.add(key);
      signatures.add(signature);
      tabs.push({ name, rows });
    } catch {
      /* skip missing tabs */
    }
  };

  const batch = 6;
  for (let i = 0; i < names.length; i += batch) {
    await Promise.all(names.slice(i, i + batch).map(trySheet));
  }
  return { title: tabs[0]?.name ? "Google Sheet" : "", tabs };
}

export type SheetsApiAuth = { apiKey?: string; accessToken?: string };

export async function sheetsApiGet(
  spreadsheetId: string,
  auth: SheetsApiAuth,
): Promise<{ title: string; sheets: Array<{ title: string; sheetId: number }> }> {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  url.searchParams.set("fields", "properties.title,sheets.properties(sheetId,title)");
  if (auth.apiKey && !auth.accessToken) url.searchParams.set("key", auth.apiKey);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(apiError(res.status, body));
  }
  const json = (await res.json()) as {
    properties?: { title?: string };
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  };
  return {
    title: json.properties?.title ?? "Google Sheet",
    sheets: (json.sheets ?? [])
      .map((s) => ({
        title: s.properties?.title ?? "",
        sheetId: s.properties?.sheetId ?? 0,
      }))
      .filter((s) => s.title),
  };
}

export async function sheetsApiValues(
  spreadsheetId: string,
  range: string,
  auth: SheetsApiAuth,
): Promise<string[][]> {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
  );
  url.searchParams.set("valueRenderOption", "UNFORMATTED_VALUE");
  if (auth.apiKey && !auth.accessToken) url.searchParams.set("key", auth.apiKey);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(apiError(res.status, await res.text()));
  const json = (await res.json()) as { values?: unknown[][] };
  return (json.values ?? []).map((row) => row.map((c) => (c == null ? "" : String(c))));
}

export async function sheetsApiCreate(
  title: string,
  tabNames: string[],
  auth: { accessToken: string },
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title },
      sheets: tabNames.map((n) => ({ properties: { title: n } })),
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(apiError(res.status, await res.text()));
  const json = (await res.json()) as { spreadsheetId: string; spreadsheetUrl: string };
  return json;
}

export async function sheetsApiUpdate(
  spreadsheetId: string,
  data: Array<{ range: string; values: string[][] }>,
  auth: { accessToken: string },
) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: data.map((d) => ({ range: d.range, values: d.values })),
      }),
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!res.ok) throw new Error(apiError(res.status, await res.text()));
}

function apiError(status: number, body: string): string {
  try {
    const j = JSON.parse(body) as { error?: { message?: string } };
    if (j.error?.message) return j.error.message;
  } catch {
    /* ignore */
  }
  if (status === 403 || status === 401) {
    return "Google menolak akses. Bagikan sheet ke “Siapa saja yang memiliki link”, atau izinkan Google Sheets API.";
  }
  return `Google Sheets API gagal (${status})`;
}
