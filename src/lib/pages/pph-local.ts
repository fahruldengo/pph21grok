import { DEFAULT_ELEMENTS, type TaxElements } from "@/lib/pph/calculate";
import { lastDayOfMonth } from "@/lib/pph/format";
import { SEED_EMPLOYEES } from "@/lib/pph/seed-employees";
import type {
  Company,
  Employee,
  NonPermanentRow,
  PayrollLine,
  PayrollSave,
} from "@/lib/pph/types";
import type { ImportBundle } from "@/lib/sheets/map";
import { dbKey, readSession } from "./storage";

type Db = {
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
    if (!raw) return seed(emptyDb());
    const db = JSON.parse(raw) as Db;
    if (!db.employees?.length) return seed(db);
    return db;
  } catch {
    return seed(emptyDb());
  }
}

function save(userId: string, db: Db) {
  localStorage.setItem(dbKey(userId), JSON.stringify(db));
}

function seed(db: Db): Db {
  const year = 2026;
  const months = [1, 2, 3, 4, 5, 6, 7, 8];
  const have = new Set(db.employees.map((e) => e.nik));
  for (const e of SEED_EMPLOYEES) {
    if (have.has(e.nik)) continue;
    const id = db.nextEmp++;
    db.employees.push({
      id,
      nama: e.nama,
      jenisKelamin: e.jenisKelamin,
      jabatan: e.jabatan,
      nik: e.nik,
      npwp: e.nik,
      punyaNpwp: true,
      kodeObjekPajak: "21-100-01",
      ptkp: e.ptkp,
      alamat: e.alamat,
      karyawanAsing: false,
      negara: "Indonesia",
      kodeNegara: "IDN",
      bulanMulai: 1,
      bulanAkhir: 12,
      grossUp: true,
      aktif: true,
    });
    for (const bulan of months) {
      db.payroll.push({
        id: db.nextPay++,
        employeeId: id,
        tahun: year,
        bulan,
        gaji: e.gaji,
        tunjangan: e.tunjangan,
        honorarium: 0,
        uangMakan: 0,
        uangLembur: 0,
        penghasilanLain: 0,
        natura: 0,
        bonus: 0,
        thr: 0,
        tantiem: 0,
        zakat: 0,
        tanggalPemotongan: lastDayOfMonth(year, bulan),
        fasilitasPajak: "Tanpa Fasilitas",
      });
    }
  }
  return db;
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
    employees: db.employees.filter((e) => e.aktif),
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
    aktif: true,
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
  if (!db.employees.some((e) => e.id === data.line.employeeId)) {
    throw new Error("Karyawan tidak ditemukan");
  }
  const tgl = lastDayOfMonth(data.tahun, data.bulan);
  const idx = db.payroll.findIndex(
    (p) => p.employeeId === data.line.employeeId && p.tahun === data.tahun && p.bulan === data.bulan,
  );
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

export async function copyMonth(input: DataArg<{ tahun: number; fromBulan: number; toBulan: number }>) {
  const data = unwrap(input);
  const userId = uid();
  const db = load(userId);
  const tgl = lastDayOfMonth(data.tahun, data.toBulan);
  const src = db.payroll.filter((p) => p.tahun === data.tahun && p.bulan === data.fromBulan);
  for (const row of src) {
    const idx = db.payroll.findIndex(
      (p) => p.employeeId === row.employeeId && p.tahun === data.tahun && p.bulan === data.toBulan,
    );
    const next: PayrollLine = {
      ...row,
      id: idx >= 0 ? db.payroll[idx].id : db.nextPay++,
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
  return { copied: src.length };
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

export function applyImportBundle(bundle: ImportBundle, tahun: number) {
  const userId = uid();
  const db = load(userId);
  if (bundle.company && (bundle.company.nama || bundle.company.npwp)) {
    const c = bundle.company;
    db.company = {
      ...db.company,
      nama: c.nama || db.company.nama,
      npwp: c.npwp || db.company.npwp,
      alamat: c.alamat || db.company.alamat,
      kota: c.kota || db.company.kota,
      nitku: c.nitku || db.company.nitku,
      namaPemotong: c.namaPemotong || db.company.namaPemotong,
      npwpPemotong: c.npwpPemotong || db.company.npwpPemotong,
      tahunPajak: tahun || db.company.tahunPajak,
    };
  }

  const nikToId = new Map(db.employees.map((e) => [e.nik, e.id]));
  let upserted = 0;
  for (const e of bundle.employees) {
    if (!e.nik) continue;
    const have = nikToId.get(e.nik);
    if (have) {
      db.employees = db.employees.map((row) =>
        row.id === have
          ? {
              ...row,
              nama: e.nama,
              jenisKelamin: e.jenisKelamin,
              jabatan: e.jabatan,
              npwp: e.npwp,
              kodeObjekPajak: e.kodeObjekPajak,
              ptkp: e.ptkp,
              alamat: e.alamat,
              karyawanAsing: e.karyawanAsing,
              negara: e.negara,
              bulanMulai: e.bulanMulai,
              bulanAkhir: e.bulanAkhir,
              grossUp: e.grossUp,
              aktif: true,
            }
          : row,
      );
      upserted += 1;
    } else {
      const id = db.nextEmp++;
      db.employees.push({
        id,
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
        kodeNegara: "IDN",
        bulanMulai: e.bulanMulai,
        bulanAkhir: e.bulanAkhir,
        grossUp: e.grossUp,
        aktif: true,
      });
      nikToId.set(e.nik, id);
      upserted += 1;
    }
  }

  let payLines = 0;
  for (const line of bundle.payroll) {
    const empId = nikToId.get(line.nik);
    if (!empId) continue;
    const tgl = lastDayOfMonth(line.tahun, line.bulan);
    const idx = db.payroll.findIndex(
      (p) => p.employeeId === empId && p.tahun === line.tahun && p.bulan === line.bulan,
    );
    const next: PayrollLine = {
      id: idx >= 0 ? db.payroll[idx].id : db.nextPay++,
      employeeId: empId,
      tahun: line.tahun,
      bulan: line.bulan,
      gaji: line.gaji,
      tunjangan: line.tunjangan,
      honorarium: line.honorarium,
      uangMakan: 0,
      uangLembur: 0,
      penghasilanLain: 0,
      natura: line.natura,
      bonus: line.bonus,
      thr: line.thr,
      tantiem: 0,
      zakat: line.zakat,
      tanggalPemotongan: tgl,
      fasilitasPajak: "Tanpa Fasilitas",
    };
    if (idx >= 0) db.payroll[idx] = next;
    else db.payroll.push(next);
    payLines += 1;
  }

  save(userId, db);
  return { employees: upserted, payroll: payLines };
}

export function snapshotMonth(tahun: number, bulan: number) {
  const userId = uid();
  const db = load(userId);
  return {
    company: db.company,
    employees: db.employees.filter((e) => e.aktif),
    lines: db.payroll.filter((p) => p.tahun === tahun && p.bulan === bulan),
  };
}
