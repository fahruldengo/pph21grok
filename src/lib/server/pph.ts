import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { num } from "@/lib/utils";
import {
  DEFAULT_ELEMENTS,
  type TaxElements,
} from "@/lib/pph/calculate";
import { lastDayOfMonth } from "@/lib/pph/format";
import type {
  Company,
  Employee,
  NonPermanentRow,
  PayrollLine,
  PayrollSave,
} from "@/lib/pph/types";

function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: num(row.id),
    nama: String(row.nama ?? ""),
    npwp: String(row.npwp ?? ""),
    alamat: String(row.alamat ?? ""),
    kota: String(row.kota ?? ""),
    nitku: String(row.nitku ?? ""),
    namaPemotong: String(row.nama_pemotong ?? ""),
    npwpPemotong: String(row.npwp_pemotong ?? ""),
    tahunPajak: num(row.tahun_pajak) || 2026,
  };
}

function mapElements(row: Record<string, unknown> | undefined): TaxElements {
  if (!row) return { ...DEFAULT_ELEMENTS };
  return {
    jhtEmployer: num(row.jht_employer),
    jkkEmployer: num(row.jkk_employer),
    jkmEmployer: num(row.jkm_employer),
    jpEmployer: num(row.jp_employer),
    kesEmployer: num(row.kes_employer),
    jhtEmployee: num(row.jht_employee),
    jpEmployee: num(row.jp_employee),
    kesEmployee: num(row.kes_employee),
    jpMax: num(row.jp_max),
    kesMax: num(row.kes_max),
    jhtEmployerAddBruto: Boolean(row.jht_employer_add_bruto),
    jpEmployerAddBruto: Boolean(row.jp_employer_add_bruto),
  };
}

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: num(row.id),
    nama: String(row.nama ?? ""),
    jenisKelamin: String(row.jenis_kelamin ?? "LAKI-LAKI"),
    jabatan: String(row.jabatan ?? ""),
    nik: String(row.nik ?? ""),
    npwp: String(row.npwp ?? ""),
    punyaNpwp: Boolean(row.punya_npwp),
    kodeObjekPajak: String(row.kode_objek_pajak ?? "21-100-01"),
    ptkp: String(row.ptkp ?? "TK/0"),
    alamat: String(row.alamat ?? ""),
    karyawanAsing: Boolean(row.karyawan_asing),
    negara: String(row.negara ?? "Indonesia"),
    kodeNegara: String(row.kode_negara ?? "IDN"),
    bulanMulai: num(row.bulan_mulai) || 1,
    bulanAkhir: num(row.bulan_akhir) || 12,
    grossUp: Boolean(row.gross_up),
    aktif: Boolean(row.aktif),
    gaji: num(row.gaji),
    tunjangan: num(row.tunjangan),
  };
}

function mapPayroll(row: Record<string, unknown>): PayrollLine {
  return {
    id: num(row.id),
    employeeId: num(row.employee_id),
    tahun: num(row.tahun),
    bulan: num(row.bulan),
    gaji: num(row.gaji),
    tunjangan: num(row.tunjangan),
    honorarium: num(row.honorarium),
    uangMakan: num(row.uang_makan),
    uangLembur: num(row.uang_lembur),
    penghasilanLain: num(row.penghasilan_lain),
    natura: num(row.natura),
    bonus: num(row.bonus),
    thr: num(row.thr),
    tantiem: num(row.tantiem),
    zakat: num(row.zakat),
    tanggalPemotongan: row.tanggal_pemotongan
      ? String(row.tanggal_pemotongan).slice(0, 10)
      : null,
    fasilitasPajak: String(row.fasilitas_pajak ?? "Tanpa Fasilitas"),
  };
}

const g = globalThis as typeof globalThis & {
  __pphSeedLocks__?: Map<string, Promise<void>>;
};

function seedLocks() {
  g.__pphSeedLocks__ ??= new Map();
  return g.__pphSeedLocks__;
}

async function seedIfEmpty(userId: string) {
  const locks = seedLocks();
  const running = locks.get(userId);
  if (running) return running;
  const job = actuallySeed(userId);
  locks.set(userId, job);
  try {
    await job;
  } finally {
    if (locks.get(userId) === job) locks.delete(userId);
  }
}

async function actuallySeed(userId: string) {
  const sql = await getSql();
  await sql`
    insert into companies (
      user_id, nama, npwp, alamat, kota, nitku, nama_pemotong, npwp_pemotong, tahun_pajak
    ) values (
      ${userId},
      ${"CV. VIDYA AMALIAH"},
      ${"0934538901822000"},
      ${"JL. NANI WARTABONE, KOTA SELATAN"},
      ${"GORONTALO"},
      ${"811435431"},
      ${"YASIN YUSUF"},
      ${"077250454822000"},
      ${2026}
    )
    on conflict (user_id) do nothing
  `;
  await sql`
    insert into tax_elements (user_id) values (${userId})
    on conflict (user_id) do nothing
  `;
}

const employeeInput = z.object({
  id: z.number().optional(),
  nama: z.string().min(1),
  jenisKelamin: z.string(),
  jabatan: z.string(),
  nik: z.string(),
  npwp: z.string(),
  punyaNpwp: z.boolean(),
  kodeObjekPajak: z.string(),
  ptkp: z.string(),
  alamat: z.string(),
  karyawanAsing: z.boolean(),
  negara: z.string(),
  bulanMulai: z.number(),
  bulanAkhir: z.number(),
  grossUp: z.boolean(),
  gaji: z.number(),
  tunjangan: z.number(),
});

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await seedIfEmpty(context.userId);
    const sql = await getSql();
    const companies = await sql<Record<string, unknown>>`
      select * from companies where user_id = ${context.userId} limit 1
    `;
    const elements = await sql<Record<string, unknown>>`
      select * from tax_elements where user_id = ${context.userId} limit 1
    `;
    const employees = await sql<Record<string, unknown>>`
      select * from employees where user_id = ${context.userId} and aktif = true order by id
    `;
    return {
      company: mapCompany(companies[0] ?? {}),
      elements: mapElements(elements[0]),
      employees: employees.map(mapEmployee),
    };
  });

export const saveCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      nama: z.string(),
      npwp: z.string(),
      alamat: z.string(),
      kota: z.string(),
      nitku: z.string(),
      namaPemotong: z.string(),
      npwpPemotong: z.string(),
      tahunPajak: z.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into companies (
        user_id, nama, npwp, alamat, kota, nitku, nama_pemotong, npwp_pemotong, tahun_pajak, updated_at
      ) values (
        ${context.userId}, ${data.nama}, ${data.npwp}, ${data.alamat}, ${data.kota},
        ${data.nitku}, ${data.namaPemotong}, ${data.npwpPemotong}, ${data.tahunPajak}, now()
      )
      on conflict (user_id) do update set
        nama = excluded.nama,
        npwp = excluded.npwp,
        alamat = excluded.alamat,
        kota = excluded.kota,
        nitku = excluded.nitku,
        nama_pemotong = excluded.nama_pemotong,
        npwp_pemotong = excluded.npwp_pemotong,
        tahun_pajak = excluded.tahun_pajak,
        updated_at = now()
    `;
    return { ok: true };
  });

export const saveElements = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      jhtEmployer: z.number(),
      jkkEmployer: z.number(),
      jkmEmployer: z.number(),
      jpEmployer: z.number(),
      kesEmployer: z.number(),
      jhtEmployee: z.number(),
      jpEmployee: z.number(),
      kesEmployee: z.number(),
      jpMax: z.number(),
      kesMax: z.number(),
      jhtEmployerAddBruto: z.boolean(),
      jpEmployerAddBruto: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into tax_elements (
        user_id, jht_employer, jkk_employer, jkm_employer, jp_employer, kes_employer,
        jht_employee, jp_employee, kes_employee, jp_max, kes_max,
        jht_employer_add_bruto, jp_employer_add_bruto, updated_at
      ) values (
        ${context.userId}, ${data.jhtEmployer}, ${data.jkkEmployer}, ${data.jkmEmployer},
        ${data.jpEmployer}, ${data.kesEmployer}, ${data.jhtEmployee}, ${data.jpEmployee},
        ${data.kesEmployee}, ${data.jpMax}, ${data.kesMax},
        ${data.jhtEmployerAddBruto}, ${data.jpEmployerAddBruto}, now()
      )
      on conflict (user_id) do update set
        jht_employer = excluded.jht_employer,
        jkk_employer = excluded.jkk_employer,
        jkm_employer = excluded.jkm_employer,
        jp_employer = excluded.jp_employer,
        kes_employer = excluded.kes_employer,
        jht_employee = excluded.jht_employee,
        jp_employee = excluded.jp_employee,
        kes_employee = excluded.kes_employee,
        jp_max = excluded.jp_max,
        kes_max = excluded.kes_max,
        jht_employer_add_bruto = excluded.jht_employer_add_bruto,
        jp_employer_add_bruto = excluded.jp_employer_add_bruto,
        updated_at = now()
    `;
    return { ok: true };
  });

export const saveEmployee = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(employeeInput)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const kodeNegara = data.negara.toLowerCase() === "indonesia" ? "IDN" : "IDN";
    if (data.id) {
      await sql`
        update employees set
          nama = ${data.nama},
          jenis_kelamin = ${data.jenisKelamin},
          jabatan = ${data.jabatan},
          nik = ${data.nik},
          npwp = ${data.npwp},
          punya_npwp = ${data.punyaNpwp},
          kode_objek_pajak = ${data.kodeObjekPajak},
          ptkp = ${data.ptkp},
          alamat = ${data.alamat},
          karyawan_asing = ${data.karyawanAsing},
          negara = ${data.negara},
          kode_negara = ${kodeNegara},
          bulan_mulai = ${data.bulanMulai},
          bulan_akhir = ${data.bulanAkhir},
          gross_up = ${data.grossUp},
          gaji = ${data.gaji},
          tunjangan = ${data.tunjangan}
        where id = ${data.id} and user_id = ${context.userId}
      `;
      return { id: data.id };
    }
    const rows = await sql<{ id: number }>`
      insert into employees (
        user_id, nama, jenis_kelamin, jabatan, nik, npwp, punya_npwp,
        kode_objek_pajak, ptkp, alamat, karyawan_asing, negara, kode_negara,
        bulan_mulai, bulan_akhir, gross_up, gaji, tunjangan
      ) values (
        ${context.userId}, ${data.nama}, ${data.jenisKelamin}, ${data.jabatan},
        ${data.nik}, ${data.npwp}, ${data.punyaNpwp}, ${data.kodeObjekPajak},
        ${data.ptkp}, ${data.alamat}, ${data.karyawanAsing}, ${data.negara},
        ${kodeNegara}, ${data.bulanMulai}, ${data.bulanAkhir}, ${data.grossUp},
        ${data.gaji}, ${data.tunjangan}
      ) returning id
    `;
    return { id: rows[0]?.id ?? 0 };
  });

export const deleteEmployee = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from employees where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const listPayroll = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ tahun: z.number(), bulan: z.number() }))
  .handler(async ({ context, data }) => {
    await seedIfEmpty(context.userId);
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from payroll_lines
      where user_id = ${context.userId} and tahun = ${data.tahun} and bulan = ${data.bulan}
    `;
    return rows.map(mapPayroll);
  });

export const listAllPayroll = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ tahun: z.number() }))
  .handler(async ({ context, data }) => {
    await seedIfEmpty(context.userId);
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from payroll_lines
      where user_id = ${context.userId} and tahun = ${data.tahun}
      order by bulan, employee_id
    `;
    return rows.map(mapPayroll);
  });

export const savePayroll = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      tahun: z.number(),
      bulan: z.number(),
      line: z.object({
        employeeId: z.number(),
        gaji: z.number(),
        tunjangan: z.number(),
        honorarium: z.number(),
        uangMakan: z.number(),
        uangLembur: z.number(),
        penghasilanLain: z.number(),
        natura: z.number(),
        bonus: z.number(),
        thr: z.number(),
        tantiem: z.number(),
        zakat: z.number(),
      }),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const owned = await sql<{ id: number }>`
      select id from employees where id = ${data.line.employeeId} and user_id = ${context.userId}
    `;
    if (!owned[0]) throw new Error("Karyawan tidak ditemukan");
    const tgl = lastDayOfMonth(data.tahun, data.bulan);
    const l = data.line as PayrollSave;
    await sql`
      insert into payroll_lines (
        user_id, employee_id, tahun, bulan, gaji, tunjangan, honorarium,
        uang_makan, uang_lembur, penghasilan_lain, natura, bonus, thr, tantiem, zakat, tanggal_pemotongan
      ) values (
        ${context.userId}, ${l.employeeId}, ${data.tahun}, ${data.bulan},
        ${l.gaji}, ${l.tunjangan}, ${l.honorarium}, ${l.uangMakan}, ${l.uangLembur},
        ${l.penghasilanLain}, ${l.natura}, ${l.bonus}, ${l.thr}, ${l.tantiem}, ${l.zakat}, ${tgl}::date
      )
      on conflict (user_id, employee_id, tahun, bulan) do update set
        gaji = excluded.gaji,
        tunjangan = excluded.tunjangan,
        honorarium = excluded.honorarium,
        uang_makan = excluded.uang_makan,
        uang_lembur = excluded.uang_lembur,
        penghasilan_lain = excluded.penghasilan_lain,
        natura = excluded.natura,
        bonus = excluded.bonus,
        thr = excluded.thr,
        tantiem = excluded.tantiem,
        zakat = excluded.zakat,
        tanggal_pemotongan = excluded.tanggal_pemotongan
    `;
    return { ok: true };
  });

export const deletePayroll = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      tahun: z.number(),
      bulan: z.number(),
      employeeId: z.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      delete from payroll_lines
      where user_id = ${context.userId}
        and tahun = ${data.tahun}
        and bulan = ${data.bulan}
        and employee_id = ${data.employeeId}
    `;
    return { ok: true };
  });

export const copyMonth = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      tahun: z.number(),
      fromTahun: z.number().optional(),
      fromBulan: z.number(),
      toBulan: z.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const fromTahun = data.fromTahun ?? data.tahun;
    const tgl = lastDayOfMonth(data.tahun, data.toBulan);
    const src = await sql<Record<string, unknown>>`
      select * from payroll_lines
      where user_id = ${context.userId} and tahun = ${fromTahun} and bulan = ${data.fromBulan}
    `;
    for (const row of src) {
      const empId = num(row.employee_id);
      await sql`
        insert into payroll_lines (
          user_id, employee_id, tahun, bulan, gaji, tunjangan, honorarium,
          uang_makan, uang_lembur, penghasilan_lain, natura, bonus, thr, tantiem, zakat, tanggal_pemotongan
        ) values (
          ${context.userId}, ${empId}, ${data.tahun}, ${data.toBulan},
          ${num(row.gaji)}, ${num(row.tunjangan)}, ${num(row.honorarium)},
          ${num(row.uang_makan)}, ${num(row.uang_lembur)}, ${num(row.penghasilan_lain)},
          ${num(row.natura)}, ${0}, ${0}, ${0}, ${num(row.zakat)}, ${tgl}::date
        )
        on conflict (user_id, employee_id, tahun, bulan) do update set
          gaji = excluded.gaji,
          tunjangan = excluded.tunjangan,
          honorarium = excluded.honorarium,
          uang_makan = excluded.uang_makan,
          uang_lembur = excluded.uang_lembur,
          penghasilan_lain = excluded.penghasilan_lain,
          natura = excluded.natura
      `;
    }
    return { copied: src.length };
  });

export const listNonPermanent = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from non_permanent where user_id = ${context.userId} order by id desc
    `;
    return rows.map(
      (row): NonPermanentRow => ({
        id: num(row.id),
        masa: num(row.masa),
        tahun: num(row.tahun),
        nama: String(row.nama ?? ""),
        nik: String(row.nik ?? ""),
        ptkp: String(row.ptkp ?? "TK/0"),
        kodeObjekPajak: String(row.kode_objek_pajak ?? ""),
        penghasilan: num(row.penghasilan),
        jenisDokumen: String(row.jenis_dokumen ?? "Contract"),
        nomorDokumen: String(row.nomor_dokumen ?? ""),
        tanggalDokumen: row.tanggal_dokumen ? String(row.tanggal_dokumen).slice(0, 10) : null,
        tanggalPemotongan: row.tanggal_pemotongan
          ? String(row.tanggal_pemotongan).slice(0, 10)
          : null,
        fasilitasPajak: String(row.fasilitas_pajak ?? "Tanpa Fasilitas"),
      }),
    );
  });

export const saveNonPermanent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number().optional(),
      masa: z.number(),
      tahun: z.number(),
      nama: z.string().min(1),
      nik: z.string(),
      ptkp: z.string(),
      kodeObjekPajak: z.string(),
      penghasilan: z.number(),
      jenisDokumen: z.string(),
      nomorDokumen: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.id) {
      await sql`
        update non_permanent set
          masa = ${data.masa}, tahun = ${data.tahun}, nama = ${data.nama}, nik = ${data.nik},
          ptkp = ${data.ptkp}, kode_objek_pajak = ${data.kodeObjekPajak},
          penghasilan = ${data.penghasilan}, jenis_dokumen = ${data.jenisDokumen},
          nomor_dokumen = ${data.nomorDokumen}
        where id = ${data.id} and user_id = ${context.userId}
      `;
      return { id: data.id };
    }
    const rows = await sql<{ id: number }>`
      insert into non_permanent (
        user_id, masa, tahun, nama, nik, ptkp, kode_objek_pajak, penghasilan, jenis_dokumen, nomor_dokumen,
        tanggal_dokumen, tanggal_pemotongan
      ) values (
        ${context.userId}, ${data.masa}, ${data.tahun}, ${data.nama}, ${data.nik}, ${data.ptkp},
        ${data.kodeObjekPajak}, ${data.penghasilan}, ${data.jenisDokumen}, ${data.nomorDokumen},
        now()::date, now()::date
      ) returning id
    `;
    return { id: rows[0]?.id ?? 0 };
  });

export const deleteNonPermanent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from non_permanent where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });
