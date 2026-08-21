import type { TaxElements } from "./calculate";

export type Company = {
  id: number;
  nama: string;
  npwp: string;
  alamat: string;
  kota: string;
  nitku: string;
  namaPemotong: string;
  npwpPemotong: string;
  tahunPajak: number;
};

export type Employee = {
  id: number;
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
  kodeNegara: string;
  bulanMulai: number;
  bulanAkhir: number;
  grossUp: boolean;
  aktif: boolean;
};

export type PayrollLine = {
  id: number;
  employeeId: number;
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
  tanggalPemotongan: string | null;
  fasilitasPajak: string;
};

export type NonPermanentRow = {
  id: number;
  masa: number;
  tahun: number;
  nama: string;
  nik: string;
  ptkp: string;
  kodeObjekPajak: string;
  penghasilan: number;
  jenisDokumen: string;
  nomorDokumen: string;
  tanggalDokumen: string | null;
  tanggalPemotongan: string | null;
  fasilitasPajak: string;
};

export type Workspace = {
  company: Company;
  elements: TaxElements;
  employees: Employee[];
};

export type PayrollSave = {
  employeeId: number;
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
