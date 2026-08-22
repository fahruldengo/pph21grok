import { DEFAULT_ELEMENTS, type TaxElements } from "@/lib/pph/calculate";
import { lastDayOfMonth } from "@/lib/pph/format";
import type {
  Company,
  Employee,
  NonPermanentRow,
  PayrollLine,
  PayrollSave,
} from "@/lib/pph/types";
import { canAddSalary } from "@/lib/pph/status";
import { dbKey, readSession } from "./storage";

const DB_VERSION = 3;

type Db = {
  version: number;
  company: Company;
  elements: TaxElements;
  employees: Employee[];
  payroll: PayrollLine[];
  nonPermanent: NonPermanentRow[];
  nextEmp: number;
  nextPay: number;
  nextNp: number;
};

function uid() {
  const s = readSession();
  if (!s) throw new Error("Unauthorized");
  return s.id;
}

function emptyDb(): Db {
  return {
    version: DB_VERSION,
    company: {
      id: 1,
      nama: "CV. VIDYA AMALIAH",
      npwp: "0934538901822000",
      alamat: "JL. NANI WARTABONE, KOTA SELATAN",
      kota: "GORONTALO",
      nitku: "811435431",
      namaPemotong: "YASIN YUSUF",
      npwpPemotong: "077250454822000",
      tahunPajak: 2026,
    },
    elements: { ...DEFAULT_ELEMENTS },
    employees: [],
    payroll: [],
    nonPermanent: [],
    nextEmp: 1,
    nextPay: 1,
    nextNp: 1,
  };
}

function load(userId: string): Db {
  try {
    const raw = localStorage.getItem(dbKey(userId));
    if (!raw) return emptyDb();
    const db = JSON.parse(raw) as Db;
    if (!db.version || db.version < DB_VERSION) {
      db.employees = [];
      db.payroll = [];
      db.nextEmp = 1;
      db.nextPay = 1;
      db.version = DB_VERSION;
    }
    db.employees = (db.employees ?? []).map((e) => ({
      ...e,
      gaji: e.gaji ?? 0,
      tunjangan: e.tunjangan ?? 0,
      aktif: e.aktif !== false,
    }));
    db.payroll = db.payroll ?? [];
    db.nonPermanent = db.nonPermanent ?? [];
    return db;
  } catch {
    return emptyDb();
  }
}

function save(userId: string, db: Db) {
  db.version = DB_VERSION;
  localStorage.setItem(dbKey(userId), JSON.stringify(db));
}

type DataArg<T> = { data: T } | T;

function unwrap<T>(input: DataArg<T> | undefined): T {
  if (input && typeof input === "object" && "data" in (input as object)) {
    return (input as { data: T }).data;
  }
  return input as T;
}

export async function getWorkspace() {
  const userId = uid();
  const db = load(userId);
  save(userId, db);
  return {
    company: db.company,
    elements: db.elements,
    employees: db.employees,
  };
}

export async function saveCompany(input: DataArg<Omit<Company, "id">>) {
  const data = unwrap(input);
  const userId = uid();
  const db = load(userId);
  db.company = { ...db.company, ...data };
  save(userId, db);
  return { ok: true };
}

export async function saveElements(input: DataArg<TaxElements>) {
  const data = unwrap(input);
  const userId = uid();
  const db = load(userId);
  db.elements = { ...db.elements, ...data };
  save(userId, db);
  return { ok: true };
}

export async function saveEmployee(
  input: DataArg<{
    id?: number;
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
    gaji: number;
    tunjangan: number;
    aktif?: boolean;
  }>,
) {
  const data = unwrap(input);
  const userId = uid();
  const db = load(userId);
  if (data.id) {
    db.employees = db.employees.map((e) =>
      e.id === data.id
        ? {
            ...e,
            ...data,
            kodeNegara: "IDN",
            aktif: data.aktif ?? e.aktif ?? true,
          }
        : e,
    );
    save(userId, db);
    return { id: data.id };
  }
  const id = db.nextEmp++;
  db.employees.push({
    id,
    nama: data.nama,
    jenisKelamin: data.jenisKelamin,
    jabatan: data.jabatan,
    nik: data.nik,
    npwp: data.npwp,
    punyaNpwp: data.punyaNpwp,
    kodeObjekPajak: data.kodeObjekPajak,
    ptkp: data.ptkp,
    alamat: data.alamat,
    karyawanAsing: data.karyawanAsing,
    negara: data.negara,
    kodeNegara: "IDN",
    bulanMulai: data.bulanMulai,
    bulanAkhir: data.bulanAkhir,
    grossUp: data.grossUp,
    aktif: data.aktif ?? true,
    gaji: data.gaji,
    tunjangan: data.tunjangan,
  });
  save(userId, db);
  return { id };
}

export async function deleteEmployee(input: DataArg<{ id: number }>) {
  const { id } = unwrap(input);
  const userId = uid();
  const db = load(userId);
  db.employees = db.employees.filter((e) => e.id !== id);
  db.payroll = db.payroll.filter((p) => p.employeeId !== id);
  save(userId, db);
  return { ok: true };
}

export async function listPayroll(input: DataArg<{ tahun: number; bulan: number }>) {
  const { tahun, bulan } = unwrap(input);
  const userId = uid();
  const db = load(userId);
  save(userId, db);
  return db.payroll.filter((p) => p.tahun === tahun && p.bulan === bulan);
}

export async function listAllPayroll(input: DataArg<{ tahun: number }>) {
  const { tahun } = unwrap(input);
  const userId = uid();
  const db = load(userId);
  save(userId, db);
  return db.payroll.filter((p) => p.tahun === tahun).sort((a, b) => a.bulan - b.bulan || a.employeeId - b.employeeId);
}

export async function savePayroll(
  input: DataArg<{ tahun: number; bulan: number; line: PayrollSave }>,
) {
  const data = unwrap(input);
  const userId = uid();
  const db = load(userId);
  const emp = db.employees.find((e) => e.id === data.line.employeeId);
  if (!emp) throw new Error("Karyawan tidak ditemukan");
  const idx = db.payroll.findIndex(
    (p) => p.employeeId === data.line.employeeId && p.tahun === data.tahun && p.bulan === data.bulan,
  );
  if (idx < 0 && !canAddSalary(emp, data.bulan)) {
    throw new Error("Karyawan resign/keluar tidak bisa ditambah gaji. Data historis tetap masuk laporan tahunan.");
  }
  const tgl = lastDayOfMonth(data.tahun, data.bulan);
  const next: PayrollLine = {
    id: idx >= 0 ? db.payroll[idx].id : db.nextPay++,
    employeeId: data.line.employeeId,
    tahun: data.tahun,
    bulan: data.bulan,
    gaji: data.line.gaji,
    tunjangan: data.line.tunjangan,
    honorarium: data.line.honorarium,
    uangMakan: data.line.uangMakan,
    uangLembur: data.line.uangLembur,
    penghasilanLain: data.line.penghasilanLain,
    natura: data.line.natura,
    bonus: data.line.bonus,
    thr: data.line.thr,
    tantiem: data.line.tantiem,
    zakat: data.line.zakat,
    tanggalPemotongan: tgl,
    fasilitasPajak: "Tanpa Fasilitas",
  };
  if (idx >= 0) db.payroll[idx] = next;
  else db.payroll.push(next);
  save(userId, db);
  return { ok: true };
}

export async function deletePayroll(
  input: DataArg<{ tahun: number; bulan: number; employeeId: number }>,
) {
  const data = unwrap(input);
  const userId = uid();
  const db = load(userId);
  db.payroll = db.payroll.filter(
    (p) => !(p.employeeId === data.employeeId && p.tahun === data.tahun && p.bulan === data.bulan),
  );
  save(userId, db);
  return { ok: true };
}

export async function copyMonth(
  input: DataArg<{ tahun: number; fromTahun?: number; fromBulan: number; toBulan: number }>,
) {
  const data = unwrap(input);
  const userId = uid();
  const db = load(userId);
  const fromTahun = data.fromTahun ?? data.tahun;
  const tgl = lastDayOfMonth(data.tahun, data.toBulan);
  const src = db.payroll.filter((p) => p.tahun === fromTahun && p.bulan === data.fromBulan);
  let copied = 0;
  for (const row of src) {
    const emp = db.employees.find((e) => e.id === row.employeeId);
    if (!emp || !canAddSalary(emp, data.toBulan)) continue;
    copied += 1;
    const idx = db.payroll.findIndex(
      (p) => p.employeeId === row.employeeId && p.tahun === data.tahun && p.bulan === data.toBulan,
    );
    const next: PayrollLine = {
      ...row,
      id: idx >= 0 ? db.payroll[idx].id : db.nextPay++,
      tahun: data.tahun,
      bulan: data.toBulan,
      bonus: 0,
      thr: 0,
      tantiem: 0,
      natura: 0,
      tanggalPemotongan: tgl,
    };
    if (idx >= 0) db.payroll[idx] = { ...db.payroll[idx], ...next, id: db.payroll[idx].id };
    else db.payroll.push(next);
  }
  save(userId, db);
  return { copied };
}

export async function listNonPermanent() {
  const userId = uid();
  return load(userId).nonPermanent.slice().sort((a, b) => b.id - a.id);
}

export async function saveNonPermanent(
  input: DataArg<{
    id?: number;
    masa: number;
    tahun: number;
    nama: string;
    nik: string;
    ptkp: string;
    kodeObjekPajak: string;
    penghasilan: number;
    jenisDokumen: string;
    nomorDokumen: string;
  }>,
) {
  const data = unwrap(input);
  const userId = uid();
  const db = load(userId);
  const today = new Date().toISOString().slice(0, 10);
  if (data.id) {
    db.nonPermanent = db.nonPermanent.map((r) => (r.id === data.id ? { ...r, ...data } : r));
    save(userId, db);
    return { id: data.id };
  }
  const id = db.nextNp++;
  db.nonPermanent.push({
    id,
    masa: data.masa,
    tahun: data.tahun,
    nama: data.nama,
    nik: data.nik,
    ptkp: data.ptkp,
    kodeObjekPajak: data.kodeObjekPajak,
    penghasilan: data.penghasilan,
    jenisDokumen: data.jenisDokumen,
    nomorDokumen: data.nomorDokumen,
    tanggalDokumen: today,
    tanggalPemotongan: today,
    fasilitasPajak: "Tanpa Fasilitas",
  });
  save(userId, db);
  return { id };
}

export async function deleteNonPermanent(input: DataArg<{ id: number }>) {
  const { id } = unwrap(input);
  const userId = uid();
  const db = load(userId);
  db.nonPermanent = db.nonPermanent.filter((r) => r.id !== id);
  save(userId, db);
  return { ok: true };
}
