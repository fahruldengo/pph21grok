import { MONTHS } from "../pph/format.ts";
import { parseMoney, normHeader } from "./csv.ts";

export type SheetGrid = { name: string; rows: string[][] };

export type MappedEmployee = {
  nama: string;
  jenisKelamin: string;
  jabatan: string;
  nik: string;
  npwp: string;
  punyaNpwp: boolean;
  kodeObjekPajak: string;
  ptkp: string;
  alamat: string;
  karyawanAsing: boolean;
  negara: string;
  bulanMulai: number;
  bulanAkhir: number;
  grossUp: boolean;
};

export type MappedPayroll = {
  nik: string;
  tahun: number;
  bulan: number;
  gaji: number;
  tunjangan: number;
  honorarium: number;
  uangMakan: number;
  uangLembur: number;
  penghasilanLain: number;
  natura: number;
  bonus: number;
  thr: number;
  tantiem: number;
  zakat: number;
};

export type MappedCompany = {
  nama?: string;
  npwp?: string;
  alamat?: string;
  kota?: string;
  nitku?: string;
  namaPemotong?: string;
  npwpPemotong?: string;
};

export type ImportBundle = {
  company?: MappedCompany;
  employees: MappedEmployee[];
  payroll: MappedPayroll[];
  tabs: string[];
  warnings: string[];
};

export type SheetLink = {
  spreadsheetId: string;
  title: string;
  url: string;
  apiKey: string;
  clientId: string;
  lastSyncedAt: string | null;
};

export const EMPTY_SHEET_LINK: SheetLink = {
  spreadsheetId: "",
  title: "",
  url: "",
  apiKey: "",
  clientId: "",
  lastSyncedAt: null,
};

export const MONTH_TABS: Record<string, number> = Object.fromEntries(
  MONTHS.flatMap((m) => [
    [m.key, m.id],
    [m.label.toUpperCase(), m.id],
    [m.short.toUpperCase(), m.id],
  ]),
);

export const PROBE_TABS = [
  "PEMOTONG",
  "ELEMEN PPh 21",
  "ELEMEN",
  "DATA PEGAWAI",
  "KARYAWAN",
  ...MONTHS.map((m) => m.key),
  "JULI",
  "AGUSTUS",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
  "BP21 NON PEGAWAI TETAP",
  "BP21",
];

const FIELD_ALIASES: Record<string, string[]> = {
  nama: ["nama", "nama pegawai", "name"],
  jenisKelamin: ["jenis kelamin", "gender", "jk"],
  jabatan: ["jabatan", "posisi"],
  nik: ["nik", "nik 16 digit", "nik 16"],
  npwp: ["npwp"],
  kodeObjekPajak: ["kode objek pajak", "objek pajak"],
  ptkp: ["ptkp", "status ptkp"],
  alamat: ["alamat"],
  karyawanAsing: ["karyawan asing"],
  negara: ["negara"],
  bulanMulai: ["bulan mulai menerima penghasilan", "bulan mulai"],
  bulanAkhir: ["bulan terakhir menerima penghasilan", "bulan akhir"],
  grossUp: ["gross up", "gross-up"],
  gaji: ["gaji", "gaji pokok"],
  tunjangan: [
    "tunjangan lainnya uang lembur dan sebagainya",
    "tunjangan lainnya",
  ],
  honorarium: ["honorarium dan imbalan sejenis lainnya", "honorarium", "honor"],
  natura: ["natura dan kenikmatan objek pajak", "natura"],
  bonus: ["bonus"],
  thr: ["thr"],
  zakat: ["zakat"],
};

function aliasHits(normalized: string, alias: string): boolean {
  const a = normHeader(alias);
  if (!a || !normalized) return false;
  if (normalized === a) return true;
  return a.includes(" ") && normalized.startsWith(a);
}

function findHeaderRow(rows: string[][]): { index: number; map: Record<string, number> } | null {
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const map: Record<string, number> = {};
    rows[i].forEach((cell, col) => {
      const n = normHeader(cell);
      if (!n) return;
      for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        if (map[field] != null) continue;
        if (aliases.some((a) => aliasHits(n, a))) map[field] = col;
      }
    });
    if (map.nama != null && (map.nik != null || map.gaji != null)) {
      return { index: i, map };
    }
  }
  return null;
}

function cell(row: string[], col: number | undefined): string {
  if (col == null) return "";
  return String(row[col] ?? "").trim();
}

function yes(value: string): boolean {
  const v = value.toLowerCase();
  return v === "y" || v === "yes" || v === "ya" || v === "true" || v === "1";
}

export function tabFitsName(name: string, rows: string[][]): boolean {
  if (!rows.length) return false;
  const upper = name.trim().toUpperCase();
  const blob = rows.slice(0, 24).flat().join(" ").toUpperCase();
  if (upper.includes("PEMOTONG")) {
    return /NITKU|NAMA PERUSAHAAN|IDENTITAS PEMOTONG|NPWP PEMOTONG/.test(blob);
  }
  if (upper.includes("ELEMEN") || upper === "REF" || upper.includes("TER")) return /JKK|JHT|PTKP|TER/.test(blob);
  if (upper.includes("PEGAWAI") || upper.includes("KARYAWAN") || tabMonth(name)) {
    return parseEmployeeGrid(rows).length > 0;
  }
  return false;
}

export function tabMonth(name: string): number | null {
  const key = name.trim().toUpperCase();
  if (MONTH_TABS[key] != null) return MONTH_TABS[key];
  const first = key.split(/\s+/)[0] ?? "";
  return MONTH_TABS[first] ?? null;
}

export function parseSpreadsheetUrl(input: string): { spreadsheetId: string; gid?: string } | null {
  const trimmed = input.trim();
  const idOnly = trimmed.match(/^[a-zA-Z0-9-_]{30,}$/);
  if (idOnly) return { spreadsheetId: trimmed };
  const m = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m?.[1]) return null;
  const gid = trimmed.match(/[?&#]gid=([0-9]+)/)?.[1];
  return { spreadsheetId: m[1], gid };
}

function parseEmployeeGrid(rows: string[][]): MappedEmployee[] {
  const found = findHeaderRow(rows);
  if (!found) return [];
  const out: MappedEmployee[] = [];
  for (const row of rows.slice(found.index + 1)) {
    const nama = cell(row, found.map.nama);
    const nik = cell(row, found.map.nik).replace(/\D/g, "");
    if (!nama || nama.toUpperCase() === "NAMA") continue;
    if (/^total/i.test(nama)) continue;
    const mulai = Number(cell(row, found.map.bulanMulai)) || 1;
    const akhir = Number(cell(row, found.map.bulanAkhir)) || 12;
    const asing = cell(row, found.map.karyawanAsing);
    const npwp = cell(row, found.map.npwp);
    out.push({
      nama,
      jenisKelamin: cell(row, found.map.jenisKelamin) || "LAKI-LAKI",
      jabatan: cell(row, found.map.jabatan),
      nik: nik || npwp.replace(/\D/g, ""),
      npwp: npwp || nik,
      punyaNpwp: true,
      kodeObjekPajak: cell(row, found.map.kodeObjekPajak) || "21-100-01",
      ptkp: cell(row, found.map.ptkp) || "TK/0",
      alamat: cell(row, found.map.alamat),
      karyawanAsing: yes(asing) || asing.toUpperCase() === "Y",
      negara: cell(row, found.map.negara) || "Indonesia",
      bulanMulai: mulai,
      bulanAkhir: akhir,
      grossUp: found.map.grossUp == null ? true : yes(cell(row, found.map.grossUp)),
    });
  }
  return out;
}

function parsePayrollGrid(rows: string[][], bulan: number, tahun: number): MappedPayroll[] {
  const found = findHeaderRow(rows);
  if (!found) return [];
  const out: MappedPayroll[] = [];
  for (const row of rows.slice(found.index + 1)) {
    const nik = cell(row, found.map.nik).replace(/\D/g, "");
    const nama = cell(row, found.map.nama);
    if (!nik && !nama) continue;
    if (!nama || /^total/i.test(nama)) continue;
    out.push({
      nik,
      tahun,
      bulan,
      gaji: parseMoney(cell(row, found.map.gaji)),
      tunjangan: parseMoney(cell(row, found.map.tunjangan)),
      honorarium: parseMoney(cell(row, found.map.honorarium)),
      uangMakan: 0,
      uangLembur: 0,
      penghasilanLain: 0,
      natura: parseMoney(cell(row, found.map.natura)),
      bonus: parseMoney(cell(row, found.map.bonus)),
      thr: parseMoney(cell(row, found.map.thr)),
      tantiem: 0,
      zakat: parseMoney(cell(row, found.map.zakat)),
    });
  }
  return out;
}

function parsePemotong(rows: string[][]): MappedCompany {
  const values: string[] = [];
  for (const row of rows) {
    const nonempty = row.map((c) => c.trim()).filter(Boolean);
    if (nonempty.length === 1) values.push(nonempty[0]);
    else if (nonempty.length >= 2) values.push(nonempty[nonempty.length - 1]);
  }
  const picked = values.filter((v) => !/^pemotong|identitas|npwp|nama/i.test(v));
  return {
    nama: picked[0],
    npwp: picked[1],
    alamat: picked[2],
    kota: picked[3],
    nitku: picked[4],
    namaPemotong: picked[5],
    npwpPemotong: picked[6],
  };
}

export function buildImportBundle(tabs: SheetGrid[], tahun: number): ImportBundle {
  const warnings: string[] = [];
  const employeesByNik = new Map<string, MappedEmployee>();
  const payroll: MappedPayroll[] = [];
  let company: MappedCompany | undefined;
  const used: string[] = [];

  for (const tab of tabs) {
    const name = tab.name.trim();
    const upper = name.toUpperCase();
    if (!tab.rows.length) continue;
    used.push(name);

    if (upper.includes("PEMOTONG")) {
      company = parsePemotong(tab.rows);
      continue;
    }
    if (upper.includes("ELEMEN") || upper === "REF" || upper.includes("TER")) continue;

    const month = tabMonth(name);
    const emps = parseEmployeeGrid(tab.rows);
    for (const e of emps) {
      if (!e.nik) continue;
      if (!employeesByNik.has(e.nik)) employeesByNik.set(e.nik, e);
    }
    if (month) {
      const lines = parsePayrollGrid(tab.rows, month, tahun);
      payroll.push(...lines.filter((l) => l.nik && (l.gaji || l.tunjangan || l.honorarium)));
    } else if (!emps.length) {
      warnings.push(`Tab “${name}” tidak dikenali sebagai data pegawai/gaji.`);
    }
  }

  if (!employeesByNik.size) warnings.push("Tidak ada baris karyawan (butuh kolom Nama dan NIK).");
  return {
    company,
    employees: [...employeesByNik.values()],
    payroll,
    tabs: used,
    warnings,
  };
}

export function buildExportGrid(
  bulanLabel: string,
  employees: Array<{
    nama: string;
    jenisKelamin: string;
    jabatan: string;
    nik: string;
    kodeObjekPajak: string;
    ptkp: string;
    alamat: string;
    negara: string;
    bulanMulai: number;
    bulanAkhir: number;
    grossUp: boolean;
  }>,
  lines: Array<{
    employeeId?: number;
    nik?: string;
    gaji: number;
    tunjangan: number;
    honorarium: number;
    natura: number;
    bonus: number;
    thr: number;
    zakat: number;
  }>,
  nikByEmpId: Map<number, string>,
): string[][] {
  const header = [
    "NO.",
    "NAMA",
    "JENIS KELAMIN",
    "JABATAN",
    "NIK (16 DIGIT)",
    "KODE OBJEK PAJAK",
    "PTKP",
    "ALAMAT",
    "NEGARA",
    "BULAN MULAI MENERIMA PENGHASILAN",
    "BULAN TERAKHIR MENERIMA PENGHASILAN",
    "GROSS UP",
    "GAJI",
    "TUNJANGAN LAINNYA, UANG LEMBUR, DAN SEBAGAINYA",
    "HONORARIUM DAN IMBALAN SEJENIS LAINNYA",
    "NATURA DAN KENIKMATAN OBJEK PAJAK",
    "BONUS",
    "THR",
    "ZAKAT",
  ];
  const rows: string[][] = [[`Pajak21 — ${bulanLabel}`], [], header];
  const byNik = new Map<string, (typeof lines)[number]>();
  for (const line of lines) {
    const nik = line.nik || (line.employeeId != null ? nikByEmpId.get(line.employeeId) : undefined);
    if (nik) byNik.set(nik, line);
  }
  employees.forEach((e, i) => {
    const line = byNik.get(e.nik);
    rows.push([
      String(i + 1),
      e.nama,
      e.jenisKelamin,
      e.jabatan,
      e.nik,
      e.kodeObjekPajak,
      e.ptkp,
      e.alamat,
      e.negara,
      String(e.bulanMulai),
      String(e.bulanAkhir),
      e.grossUp ? "Yes" : "No",
      String(line?.gaji ?? 0),
      String(line?.tunjangan ?? 0),
      String(line?.honorarium ?? 0),
      String(line?.natura ?? 0),
      String(line?.bonus ?? 0),
      String(line?.thr ?? 0),
      String(line?.zakat ?? 0),
    ]);
  });
  return rows;
}
