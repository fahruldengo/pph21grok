const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
];

function threeDigits(n: number): string {
  const ratus = Math.floor(n / 100);
  const puluh = Math.floor((n % 100) / 10);
  const satu = n % 10;
  const parts: string[] = [];
  if (ratus === 1) parts.push("seratus");
  else if (ratus > 1) parts.push(`${SATUAN[ratus]} ratus`);
  if (puluh === 1) {
    if (satu === 0) parts.push("sepuluh");
    else if (satu === 1) parts.push("sebelas");
    else parts.push(`${SATUAN[satu]} belas`);
  } else {
    if (puluh > 1) parts.push(`${SATUAN[puluh]} puluh`);
    if (satu > 0) parts.push(SATUAN[satu]);
  }
  return parts.join(" ");
}

export function terbilang(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n === 0) return "Nol Rupiah";
  const groups = [
    { div: 1_000_000_000_000, label: "triliun" },
    { div: 1_000_000_000, label: "miliar" },
    { div: 1_000_000, label: "juta" },
    { div: 1_000, label: "ribu" },
    { div: 1, label: "" },
  ];
  let rest = n;
  const parts: string[] = [];
  for (const g of groups) {
    const chunk = Math.floor(rest / g.div);
    rest %= g.div;
    if (!chunk) continue;
    if (g.label === "ribu" && chunk === 1) parts.push("seribu");
    else parts.push(`${threeDigits(chunk)}${g.label ? ` ${g.label}` : ""}`);
  }
  const body = parts.join(" ").replace(/\s+/g, " ").trim();
  const titled = body.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${value < 0 ? "Minus " : ""}${titled} Rupiah`;
}

export function formatRp(value: number, withSymbol = true): string {
  const n = Number.isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
  return withSymbol ? `Rp ${formatted}` : formatted;
}

export function formatPct(rate: number): string {
  const pct = rate * 100;
  const digits = Number.isInteger(pct) ? 0 : pct < 1 ? 2 : 1;
  return `${pct.toFixed(digits).replace(".", ",")}%`;
}

export const MONTHS = [
  { id: 1, key: "JAN", label: "Januari", short: "Jan" },
  { id: 2, key: "FEB", label: "Februari", short: "Feb" },
  { id: 3, key: "MAR", label: "Maret", short: "Mar" },
  { id: 4, key: "APR", label: "April", short: "Apr" },
  { id: 5, key: "MEI", label: "Mei", short: "Mei" },
  { id: 6, key: "JUN", label: "Juni", short: "Jun" },
  { id: 7, key: "JUL", label: "Juli", short: "Jul" },
  { id: 8, key: "AGT", label: "Agustus", short: "Agt" },
  { id: 9, key: "SEP", label: "September", short: "Sep" },
  { id: 10, key: "OKT", label: "Oktober", short: "Okt" },
  { id: 11, key: "NOV", label: "November", short: "Nov" },
  { id: 12, key: "DES", label: "Desember", short: "Des" },
] as const;

export function monthLabel(id: number): string {
  return MONTHS.find((m) => m.id === id)?.label ?? String(id);
}

export function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}
