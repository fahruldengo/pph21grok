import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { lastDayOfMonth } from "@/lib/pph/format";
import { num } from "@/lib/utils";
import { toCsv } from "@/lib/sheets/csv";
import {
  buildExportGrid,
  buildImportBundle,
  parseSpreadsheetUrl,
  type SheetGrid,
} from "@/lib/sheets/map";
import {
  probeSpreadsheet,
  sheetsApiCreate,
  sheetsApiGet,
  sheetsApiUpdate,
  sheetsApiValues,
  type SheetsApiAuth,
} from "@/lib/sheets/gviz";

function mapLink(row: Record<string, unknown> | undefined) {
  return {
    spreadsheetId: String(row?.spreadsheet_id ?? ""),
    title: String(row?.title ?? ""),
    url: String(row?.url ?? ""),
    apiKey: String(row?.api_key ?? ""),
    clientId: String(row?.client_id ?? ""),
    lastSyncedAt: row?.last_synced_at ? String(row.last_synced_at) : null,
  };
}

async function loadLink(userId: string) {
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`
    select * from google_sheet_links where user_id = ${userId} limit 1
  `;
  return mapLink(rows[0]);
}

function authFrom(link: { apiKey: string }, accessToken?: string): SheetsApiAuth {
  return { apiKey: link.apiKey || undefined, accessToken: accessToken || undefined };
}

async function loadTabs(
  spreadsheetId: string,
  auth: SheetsApiAuth,
): Promise<{ title: string; tabs: SheetGrid[] }> {
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
  return probeSpreadsheet(spreadsheetId);
}

export const getSheetLink = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => loadLink(context.userId));

export const saveSheetLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      url: z.string().min(1),
      apiKey: z.string().optional(),
      clientId: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const parsed = parseSpreadsheetUrl(data.url);
    if (!parsed) throw new Error("URL Google Sheet tidak dikenali. Tempel tautan lengkap atau ID spreadsheet.");
    const sql = await getSql();
    const prev = await loadLink(context.userId);
    await sql`
      insert into google_sheet_links (
        user_id, spreadsheet_id, url, api_key, client_id, updated_at
      ) values (
        ${context.userId}, ${parsed.spreadsheetId}, ${data.url},
        ${data.apiKey ?? prev.apiKey}, ${data.clientId ?? prev.clientId}, now()
      )
      on conflict (user_id) do update set
        spreadsheet_id = excluded.spreadsheet_id,
        url = excluded.url,
        api_key = excluded.api_key,
        client_id = excluded.client_id,
        updated_at = now()
    `;
    return { spreadsheetId: parsed.spreadsheetId };
  });

export const inspectGoogleSheet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ accessToken: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const link = await loadLink(context.userId);
    if (!link.spreadsheetId) throw new Error("Hubungkan Google Sheet terlebih dahulu.");
    const result = await loadTabs(link.spreadsheetId, authFrom(link, data.accessToken));
    const sql = await getSql();
    await sql`
      update google_sheet_links set title = ${result.title}, updated_at = now()
      where user_id = ${context.userId}
    `;
    return {
      title: result.title,
      spreadsheetId: link.spreadsheetId,
      tabs: result.tabs.map((t) => ({
        name: t.name,
        rows: t.rows.length,
        preview: t.rows.slice(0, 4).map((r) => r.slice(0, 6)),
      })),
    };
  });

export const importGoogleSheet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      accessToken: z.string().optional(),
      tahun: z.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    const link = await loadLink(context.userId);
    if (!link.spreadsheetId) throw new Error("Hubungkan Google Sheet terlebih dahulu.");
    const loaded = await loadTabs(link.spreadsheetId, authFrom(link, data.accessToken));
    const bundle = buildImportBundle(loaded.tabs, data.tahun);
    const sql = await getSql();

    if (bundle.company && (bundle.company.nama || bundle.company.npwp)) {
      const c = bundle.company;
      await sql`
        insert into companies (
          user_id, nama, npwp, alamat, kota, nitku, nama_pemotong, npwp_pemotong, tahun_pajak, updated_at
        ) values (
          ${context.userId}, ${c.nama ?? ""}, ${c.npwp ?? ""}, ${c.alamat ?? ""}, ${c.kota ?? ""},
          ${c.nitku ?? ""}, ${c.namaPemotong ?? ""}, ${c.npwpPemotong ?? ""}, ${data.tahun}, now()
        )
        on conflict (user_id) do update set
          nama = coalesce(nullif(excluded.nama, ''), companies.nama),
          npwp = coalesce(nullif(excluded.npwp, ''), companies.npwp),
          alamat = coalesce(nullif(excluded.alamat, ''), companies.alamat),
          kota = coalesce(nullif(excluded.kota, ''), companies.kota),
          nitku = coalesce(nullif(excluded.nitku, ''), companies.nitku),
          nama_pemotong = coalesce(nullif(excluded.nama_pemotong, ''), companies.nama_pemotong),
          npwp_pemotong = coalesce(nullif(excluded.npwp_pemotong, ''), companies.npwp_pemotong),
          updated_at = now()
      `;
    }

    const nikToId = new Map<string, number>();
    const existing = await sql<{ id: number; nik: string }>`
      select id, nik from employees where user_id = ${context.userId}
    `;
    for (const row of existing) nikToId.set(row.nik, row.id);

    let upserted = 0;
    for (const e of bundle.employees) {
      if (!e.nik) continue;
      const have = nikToId.get(e.nik);
      if (have) {
        await sql`
          update employees set
            nama = ${e.nama},
            jenis_kelamin = ${e.jenisKelamin},
            jabatan = ${e.jabatan},
            npwp = ${e.npwp},
            kode_objek_pajak = ${e.kodeObjekPajak},
            ptkp = ${e.ptkp},
            alamat = ${e.alamat},
            karyawan_asing = ${e.karyawanAsing},
            negara = ${e.negara},
            bulan_mulai = ${e.bulanMulai},
            bulan_akhir = ${e.bulanAkhir},
            gross_up = ${e.grossUp}
          where id = ${have} and user_id = ${context.userId}
        `;
        upserted += 1;
      } else {
        const rows = await sql<{ id: number }>`
          insert into employees (
            user_id, nama, jenis_kelamin, jabatan, nik, npwp, punya_npwp,
            kode_objek_pajak, ptkp, alamat, karyawan_asing, negara, kode_negara,
            bulan_mulai, bulan_akhir, gross_up, aktif
          ) values (
            ${context.userId}, ${e.nama}, ${e.jenisKelamin}, ${e.jabatan}, ${e.nik}, ${e.npwp},
            ${e.punyaNpwp}, ${e.kodeObjekPajak}, ${e.ptkp}, ${e.alamat}, ${e.karyawanAsing},
            ${e.negara}, ${"IDN"}, ${e.bulanMulai}, ${e.bulanAkhir}, ${e.grossUp}, ${true}
          ) returning id
        `;
        const id = rows[0]?.id;
        if (id) {
          nikToId.set(e.nik, id);
          upserted += 1;
        }
      }
    }

    let payLines = 0;
    for (const line of bundle.payroll) {
      const empId = nikToId.get(line.nik);
      if (!empId) continue;
      const tgl = lastDayOfMonth(line.tahun, line.bulan);
      await sql`
        insert into payroll_lines (
          user_id, employee_id, tahun, bulan, gaji, tunjangan, honorarium,
          uang_makan, uang_lembur, penghasilan_lain, natura, bonus, thr, tantiem, zakat, tanggal_pemotongan
        ) values (
          ${context.userId}, ${empId}, ${line.tahun}, ${line.bulan},
          ${line.gaji}, ${line.tunjangan}, ${line.honorarium},
          ${0}, ${0}, ${0}, ${line.natura}, ${line.bonus}, ${line.thr}, ${0}, ${line.zakat}, ${tgl}::date
        )
        on conflict (user_id, employee_id, tahun, bulan) do update set
          gaji = excluded.gaji,
          tunjangan = excluded.tunjangan,
          honorarium = excluded.honorarium,
          natura = excluded.natura,
          bonus = excluded.bonus,
          thr = excluded.thr,
          zakat = excluded.zakat,
          tanggal_pemotongan = excluded.tanggal_pemotongan
      `;
      payLines += 1;
    }

    await sql`
      update google_sheet_links set last_synced_at = now(), title = ${loaded.title}, updated_at = now()
      where user_id = ${context.userId}
    `;

    return {
      title: loaded.title,
      employees: upserted,
      payroll: payLines,
      tabs: bundle.tabs,
      warnings: bundle.warnings,
    };
  });

export const exportToGoogleSheet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      accessToken: z.string().min(10),
      tahun: z.number(),
      bulan: z.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const companies = await sql<Record<string, unknown>>`
      select * from companies where user_id = ${context.userId} limit 1
    `;
    const employees = await sql<Record<string, unknown>>`
      select * from employees where user_id = ${context.userId} and aktif = true order by id
    `;
    const lines = await sql<Record<string, unknown>>`
      select * from payroll_lines
      where user_id = ${context.userId} and tahun = ${data.tahun} and bulan = ${data.bulan}
    `;
    const emps = employees.map((e) => ({
      id: num(e.id),
      nama: String(e.nama ?? ""),
      jenisKelamin: String(e.jenis_kelamin ?? ""),
      jabatan: String(e.jabatan ?? ""),
      nik: String(e.nik ?? ""),
      kodeObjekPajak: String(e.kode_objek_pajak ?? "21-100-01"),
      ptkp: String(e.ptkp ?? "TK/0"),
      alamat: String(e.alamat ?? ""),
      negara: String(e.negara ?? "Indonesia"),
      bulanMulai: num(e.bulan_mulai) || 1,
      bulanAkhir: num(e.bulan_akhir) || 12,
      grossUp: Boolean(e.gross_up),
    }));
    const nikByEmpId = new Map(emps.map((e) => [e.id, e.nik]));
    const pay = lines.map((l) => ({
      employeeId: num(l.employee_id),
      gaji: num(l.gaji),
      tunjangan: num(l.tunjangan),
      honorarium: num(l.honorarium),
      natura: num(l.natura),
      bonus: num(l.bonus),
      thr: num(l.thr),
      zakat: num(l.zakat),
    }));
    const monthNames = [
      "",
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MEI",
      "JUN",
      "JUL",
      "AGT",
      "SEP",
      "OKT",
      "NOV",
      "DES",
    ];
    const tab = monthNames[data.bulan] ?? `M${data.bulan}`;
    const companyName = String(companies[0]?.nama ?? "Pajak21");
    const grid = buildExportGrid(`${tab} ${data.tahun}`, emps, pay, nikByEmpId);
    const created = await sheetsApiCreate(
      `Pajak21 ${companyName} ${tab} ${data.tahun}`,
      [tab],
      { accessToken: data.accessToken },
    );
    await sheetsApiUpdate(
      created.spreadsheetId,
      [{ range: `'${tab}'!A1`, values: grid }],
      { accessToken: data.accessToken },
    );
    return { spreadsheetId: created.spreadsheetId, spreadsheetUrl: created.spreadsheetUrl };
  });

export const exportCsvMonth = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ tahun: z.number(), bulan: z.number() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const employees = await sql<Record<string, unknown>>`
      select * from employees where user_id = ${context.userId} and aktif = true order by id
    `;
    const lines = await sql<Record<string, unknown>>`
      select * from payroll_lines
      where user_id = ${context.userId} and tahun = ${data.tahun} and bulan = ${data.bulan}
    `;
    const emps = employees.map((e) => ({
      id: num(e.id),
      nama: String(e.nama ?? ""),
      jenisKelamin: String(e.jenis_kelamin ?? ""),
      jabatan: String(e.jabatan ?? ""),
      nik: String(e.nik ?? ""),
      kodeObjekPajak: String(e.kode_objek_pajak ?? "21-100-01"),
      ptkp: String(e.ptkp ?? "TK/0"),
      alamat: String(e.alamat ?? ""),
      negara: String(e.negara ?? "Indonesia"),
      bulanMulai: num(e.bulan_mulai) || 1,
      bulanAkhir: num(e.bulan_akhir) || 12,
      grossUp: Boolean(e.gross_up),
    }));
    const nikByEmpId = new Map(emps.map((e) => [e.id, e.nik]));
    const pay = lines.map((l) => ({
      employeeId: num(l.employee_id),
      gaji: num(l.gaji),
      tunjangan: num(l.tunjangan),
      honorarium: num(l.honorarium),
      natura: num(l.natura),
      bonus: num(l.bonus),
      thr: num(l.thr),
      zakat: num(l.zakat),
    }));
    const grid = buildExportGrid(`Masa ${data.bulan}/${data.tahun}`, emps, pay, nikByEmpId);
    return { csv: toCsv(grid), filename: `pajak21-${data.tahun}-${String(data.bulan).padStart(2, "0")}.csv` };
  });
