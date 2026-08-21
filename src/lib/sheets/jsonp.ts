import { parseCsv } from "./csv";
import { PROBE_TABS, tabFitsName, type SheetGrid } from "./map";

type GvizCell = { v?: unknown; f?: string | null } | null;
type GvizPayload = {
  status?: string;
  table?: {
    cols?: Array<{ id?: string; label?: string }>;
    rows?: Array<{ c?: GvizCell[] }>;
  };
  errors?: Array<{ reason?: string; message?: string }>;
};

let jsonpSeq = 0;

function cellText(cell: GvizCell): string {
  if (!cell) return "";
  if (cell.f != null && String(cell.f).trim() !== "") return String(cell.f);
  if (cell.v == null) return "";
  return String(cell.v);
}

function tableToRows(payload: GvizPayload): string[][] {
  const table = payload.table;
  if (!table) return [];
  const labels = (table.cols ?? []).map((c) => String(c.label ?? ""));
  const body = (table.rows ?? []).map((r) => (r.c ?? []).map(cellText));
  const width = Math.max(labels.length, ...body.map((r) => r.length), 0);
  const pad = (row: string[]) => {
    const copy = row.slice();
    while (copy.length < width) copy.push("");
    return copy;
  };
  const hasLabels = labels.some((l) => l.trim());
  return hasLabels ? [pad(labels), ...body.map(pad)] : body.map(pad);
}

export function fetchGvizJsonp(spreadsheetId: string, sheet?: string, timeoutMs = 15000): Promise<string[][] | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    jsonpSeq += 1;
    const cbName = `__pajak21Gviz${Date.now()}_${jsonpSeq}`;
    const script = document.createElement("script");
    let settled = false;

    const finish = (rows: string[][] | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      delete (window as unknown as Record<string, unknown>)[cbName];
      script.remove();
      resolve(rows);
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);

    (window as unknown as Record<string, unknown>)[cbName] = (payload: GvizPayload) => {
      if (!payload || payload.status === "error") {
        finish(null);
        return;
      }
      const rows = tableToRows(payload);
      finish(rows.length ? rows : null);
    };

    script.onerror = () => finish(null);
    const tqx = `out:json;responseHandler:${cbName}`;
    const params = new URLSearchParams({ tqx });
    if (sheet) params.set("sheet", sheet);
    script.src = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?${params.toString()}`;
    document.head.appendChild(script);
  });
}

export async function probeSpreadsheetJsonp(
  spreadsheetId: string,
  names: string[] = PROBE_TABS,
): Promise<{ title: string; tabs: SheetGrid[] }> {
  const tabs: SheetGrid[] = [];
  const seen = new Set<string>();
  const signatures = new Set<string>();
  const sig = (rows: string[][]) => rows.slice(0, 3).flat().join("|").slice(0, 180);

  let firstRows: string[][] | null = null;
  try {
    firstRows = await fetchGvizJsonp(spreadsheetId);
  } catch {
    firstRows = null;
  }
  if (firstRows?.length) {
    signatures.add(sig(firstRows));
    tabs.push({ name: "Sheet1", rows: firstRows });
  }

  const run = async (name: string) => {
    const key = name.toUpperCase();
    if (seen.has(key) || key === "SHEET1") return;
    try {
      const rows = await fetchGvizJsonp(spreadsheetId, name);
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
      /* skip */
    }
  };

  const batch = 5;
  for (let i = 0; i < names.length; i += batch) {
    await Promise.all(names.slice(i, i + batch).map(run));
  }

  return { title: tabs[0]?.name ? "Google Sheet" : "", tabs };
}

/** Last-resort parse if a gviz CSV response sneaks through as text. */
export function rowsFromGvizText(text: string): string[][] | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("<")) return null;
  const rows = parseCsv(trimmed);
  return rows.length ? rows : null;
}
