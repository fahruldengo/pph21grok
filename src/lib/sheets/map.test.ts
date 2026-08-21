import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildImportBundle, parseSpreadsheetUrl, tabFitsName } from "./map.ts";

describe("parseSpreadsheetUrl", () => {
  it("reads a full docs URL", () => {
    const parsed = parseSpreadsheetUrl(
      "https://docs.google.com/spreadsheets/d/1AbCDefGhIjKLmnopQRstuVWxyz0123456789/edit?gid=0#gid=0",
    );
    assert.equal(parsed?.spreadsheetId, "1AbCDefGhIjKLmnopQRstuVWxyz0123456789");
    assert.equal(parsed?.gid, "0");
  });

  it("accepts a bare id", () => {
    const parsed = parseSpreadsheetUrl("1AbCDefGhIjKLmnopQRstuVWxyz0123456789abcd");
    assert.equal(parsed?.spreadsheetId, "1AbCDefGhIjKLmnopQRstuVWxyz0123456789abcd");
  });

  it("rejects noise", () => {
    assert.equal(parseSpreadsheetUrl("https://example.com/sheet"), null);
  });
});

describe("buildImportBundle", () => {
  it("maps JAN columns and ignores TUNJANGAN PPh", () => {
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
      "TUNJANGAN PPh 21",
      "TUNJANGAN LAINNYA, UANG LEMBUR, DAN SEBAGAINYA",
      "HONORARIUM DAN IMBALAN SEJENIS LAINNYA",
    ];
    const row = [
      "1",
      "FARIN POHANTALO JAN",
      "PEREMPUAN",
      "STAF",
      "7501010101010001",
      "21-100-01",
      "K/3",
      "GORONTALO",
      "Indonesia",
      "1",
      "12",
      "Yes",
      "7.120.576",
      "999999",
      "6.500.000",
      "0",
    ];
    const bundle = buildImportBundle(
      [
        { name: "JAN", rows: [["PPh 21 JANUARI"], [], header, [], row] },
        {
          name: "PEMOTONG",
          rows: [
            ["Nama", "CV. VIDYA AMALIAH"],
            ["NPWP", "0934538901822000"],
            ["Alamat", "JL. NANI WARTABONE"],
          ],
        },
      ],
      2026,
    );
    assert.equal(bundle.employees.length, 1);
    assert.equal(bundle.employees[0]?.ptkp, "K/3");
    assert.equal(bundle.payroll.length, 1);
    assert.equal(bundle.payroll[0]?.gaji, 7120576);
    assert.equal(bundle.payroll[0]?.tunjangan, 6500000);
    assert.equal(bundle.company?.nama, "CV. VIDYA AMALIAH");
    assert.equal(tabFitsName("JAN", [header, row]), true);
    assert.equal(tabFitsName("PEMOTONG", [["Student Name", "Gender"]]), false);
    assert.equal(tabFitsName("DATA PEGAWAI", [["Student Name", "Gender"]]), false);
  });
});
