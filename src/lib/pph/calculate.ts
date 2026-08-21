import { roundDown, roundDownThousands, roundTo } from "@/lib/utils";
import { lookupTerHarian, lookupTerRate, terCategory, type TerCategory } from "./ter";
import { ptkpYearly } from "./ptkp";
import { findObjek, type TarifKind } from "./objek-pajak";

export type TaxElements = {
  jhtEmployer: number;
  jkkEmployer: number;
  jkmEmployer: number;
  jpEmployer: number;
  kesEmployer: number;
  jhtEmployee: number;
  jpEmployee: number;
  kesEmployee: number;
  jpMax: number;
  kesMax: number;
  jhtEmployerAddBruto: boolean;
  jpEmployerAddBruto: boolean;
};

export const DEFAULT_ELEMENTS: TaxElements = {
  jhtEmployer: 0.037,
  jkkEmployer: 0.0024,
  jkmEmployer: 0.003,
  jpEmployer: 0.02,
  kesEmployer: 0.04,
  jhtEmployee: 0.02,
  jpEmployee: 0.01,
  kesEmployee: 0.01,
  jpMax: 10_042_300,
  kesMax: 12_000_000,
  jhtEmployerAddBruto: false,
  jpEmployerAddBruto: false,
};

export type MonthlyInput = {
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
  ptkp: string;
  grossUp: boolean;
  punyaNpwp: boolean;
};

export type PremiBreakdown = {
  jkk: number;
  jkm: number;
  kes: number;
  jhtEmployer: number;
  jpEmployer: number;
  totalAddBruto: number;
  jhtEmployee: number;
  jpEmployee: number;
  kesEmployee: number;
  iuranPensiun: number;
};

export type MonthlyResult = {
  premi: PremiBreakdown;
  penghasilanTeratur: number;
  penghasilanTidakTeratur: number;
  tunjanganPph: number;
  bruto: number;
  kategoriTer: TerCategory;
  tarifTer: number;
  pph: number;
  iuranPensiun: number;
  zakat: number;
  takeHome: number;
};

export function computePremi(gaji: number, el: TaxElements): PremiBreakdown {
  const g = Math.max(0, gaji);
  const jkk = g * el.jkkEmployer;
  const jkm = g * el.jkmEmployer;
  const kes = Math.min(g, el.kesMax) * el.kesEmployer;
  const jhtEmployer = g * el.jhtEmployer;
  const jpEmployer = Math.min(g, el.jpMax) * el.jpEmployer;
  const jhtEmployee = g * el.jhtEmployee;
  const jpEmployee = Math.min(g, el.jpMax) * el.jpEmployee;
  const kesEmployee = Math.min(g, el.kesMax) * el.kesEmployee;
  let totalAddBruto = jkk + jkm + kes;
  if (el.jhtEmployerAddBruto) totalAddBruto += jhtEmployer;
  if (el.jpEmployerAddBruto) totalAddBruto += jpEmployer;
  return {
    jkk,
    jkm,
    kes,
    jhtEmployer,
    jpEmployer,
    totalAddBruto,
    jhtEmployee,
    jpEmployee,
    kesEmployee,
    iuranPensiun: jhtEmployee + jpEmployee,
  };
}

function teraturBase(input: MonthlyInput, premi: PremiBreakdown): number {
  return (
    input.gaji +
    input.tunjangan +
    input.honorarium +
    input.uangMakan +
    input.uangLembur +
    input.penghasilanLain +
    input.natura +
    premi.totalAddBruto
  );
}

function tidakTeratur(input: MonthlyInput): number {
  return input.bonus + input.thr + input.tantiem;
}

function pphFromBruto(
  bruto: number,
  ptkp: string,
  punyaNpwp: boolean,
  roundPph: "round" | "down",
): { kategori: TerCategory; tarif: number; pph: number } {
  const kategori = terCategory(ptkp);
  const tarif = lookupTerRate(kategori, bruto);
  const raw = bruto * tarif * (punyaNpwp ? 1 : 1.2);
  const pph = roundPph === "down" ? roundDown(raw) : roundTo(raw);
  return { kategori, tarif, pph };
}

export function calculateMonthly(
  input: MonthlyInput,
  el: TaxElements = DEFAULT_ELEMENTS,
  opts: { roundPph?: "round" | "down" } = {},
): MonthlyResult {
  const roundPph = opts.roundPph ?? "round";
  const premi = computePremi(input.gaji, el);
  const baseTeratur = teraturBase(input, premi);
  const irregular = tidakTeratur(input);

  let tunjanganPph = 0;
  let bruto = roundDown(baseTeratur + irregular);
  let tax = pphFromBruto(bruto, input.ptkp, input.punyaNpwp, roundPph);

  if (input.grossUp) {
    for (let i = 0; i < 24; i++) {
      tunjanganPph = tax.pph;
      const next = roundDown(baseTeratur + tunjanganPph + irregular);
      const nextTax = pphFromBruto(next, input.ptkp, input.punyaNpwp, roundPph);
      if (next === bruto && nextTax.pph === tax.pph) break;
      bruto = next;
      tax = nextTax;
    }
    tunjanganPph = tax.pph;
  }

  const penghasilanTeratur = baseTeratur + tunjanganPph;
  const takeHome =
    input.gaji +
    input.tunjangan +
    input.honorarium +
    input.uangMakan +
    input.uangLembur +
    input.penghasilanLain +
    irregular -
    (input.grossUp ? 0 : tax.pph) -
    premi.jhtEmployee -
    premi.jpEmployee -
    premi.kesEmployee -
    input.zakat;

  return {
    premi,
    penghasilanTeratur,
    penghasilanTidakTeratur: irregular,
    tunjanganPph,
    bruto,
    kategoriTer: tax.kategori,
    tarifTer: tax.tarif,
    pph: tax.pph,
    iuranPensiun: premi.iuranPensiun,
    zakat: input.zakat,
    takeHome,
  };
}

export function pphPasal17(pkp: number): number {
  if (pkp <= 0) return 0;
  const brackets: Array<[number, number]> = [
    [60_000_000, 0.05],
    [250_000_000, 0.15],
    [500_000_000, 0.25],
    [5_000_000_000, 0.3],
    [Number.POSITIVE_INFINITY, 0.35],
  ];
  let tax = 0;
  let prev = 0;
  for (const [cap, rate] of brackets) {
    if (pkp <= prev) break;
    const slice = Math.min(pkp, cap) - prev;
    if (slice > 0) tax += slice * rate;
    prev = cap;
  }
  return roundTo(tax);
}

export function pphPesangon(dpp: number): number {
  if (dpp <= 50_000_000) return 0;
  let tax = 0;
  const b1 = Math.min(dpp, 100_000_000) - 50_000_000;
  if (b1 > 0) tax += b1 * 0.05;
  const b2 = Math.min(dpp, 500_000_000) - 100_000_000;
  if (b2 > 0) tax += b2 * 0.15;
  const b3 = dpp - 500_000_000;
  if (b3 > 0) tax += b3 * 0.25;
  return roundTo(tax);
}

export function pphPensiunSekaligus(dpp: number): number {
  if (dpp <= 50_000_000) return 0;
  return roundTo((dpp - 50_000_000) * 0.05);
}

export type AnnualMonth = {
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
  pphDipotong: number;
  iuranPensiun: number;
};

export type AnnualInput = {
  ptkp: string;
  grossUp: boolean;
  punyaNpwp: boolean;
  jenisPemotongan: "FullYear" | "Annualized" | "PartialYear";
  monthsWorked: number;
  pphSebelumnya: number;
  netoSebelumnya: number;
  months: AnnualMonth[];
};

export type AnnualResult = {
  gaji: number;
  tunjangan: number;
  honorarium: number;
  premiAsuransi: number;
  natura: number;
  tunjanganPph: number;
  penghasilanTeratur: number;
  penghasilanTidakTeratur: number;
  bruto: number;
  biayaJabatan: number;
  iuranPensiun: number;
  zakat: number;
  pengurang: number;
  neto: number;
  netoSetahun: number;
  ptkp: number;
  pkp: number;
  pphSetahun: number;
  pphTerutang: number;
  pphDipotongSebelumnya: number;
  pphKurangLebih: number;
  monthsWorked: number;
};

export function calculateAnnual(
  input: AnnualInput,
  el: TaxElements = DEFAULT_ELEMENTS,
): AnnualResult {
  const months = input.months;
  const monthsWorked = Math.max(1, Math.min(12, input.monthsWorked || months.length || 12));

  let gaji = 0;
  let tunjangan = 0;
  let honorarium = 0;
  let natura = 0;
  let irregular = 0;
  let zakat = 0;
  let iuran = 0;
  let pphPrev = input.pphSebelumnya;
  let premiAsuransi = 0;

  for (const m of months) {
    gaji += m.gaji;
    tunjangan += m.tunjangan + m.uangMakan + m.uangLembur + m.penghasilanLain;
    honorarium += m.honorarium;
    natura += m.natura;
    irregular += m.bonus + m.thr + m.tantiem;
    zakat += m.zakat;
    const premi = computePremi(m.gaji, el);
    premiAsuransi += premi.totalAddBruto;
    iuran += m.iuranPensiun || premi.iuranPensiun;
    pphPrev += m.pphDipotong;
  }

  const baseTeratur = gaji + tunjangan + honorarium + natura + premiAsuransi;
  let tunjanganPph = 0;
  let bruto = roundDown(baseTeratur + irregular);

  const biayaJabatanOf = (b: number) => Math.min(b * 0.05, 500_000 * monthsWorked);

  const finish = (b: number, tPph: number): AnnualResult => {
    const bj = biayaJabatanOf(b);
    const pengurang = bj + iuran + zakat;
    const neto = b - pengurang;
    const netoSetahun =
      input.jenisPemotongan === "Annualized"
        ? ((neto + input.netoSebelumnya) * 12) / monthsWorked
        : neto + input.netoSebelumnya;
    const ptkp = ptkpYearly(input.ptkp);
    const pkp = roundDownThousands(Math.max(0, netoSetahun - ptkp));
    let pphSetahun = pphPasal17(pkp);
    if (!input.punyaNpwp) pphSetahun = roundTo(pphSetahun * 1.2);
    const pphTerutang =
      input.jenisPemotongan === "Annualized"
        ? roundTo((pphSetahun * monthsWorked) / 12)
        : pphSetahun;
    return {
      gaji,
      tunjangan,
      honorarium,
      premiAsuransi,
      natura,
      tunjanganPph: tPph,
      penghasilanTeratur: baseTeratur + tPph,
      penghasilanTidakTeratur: irregular,
      bruto: b,
      biayaJabatan: bj,
      iuranPensiun: iuran,
      zakat,
      pengurang,
      neto,
      netoSetahun,
      ptkp,
      pkp,
      pphSetahun,
      pphTerutang,
      pphDipotongSebelumnya: pphPrev,
      pphKurangLebih: pphTerutang - pphPrev,
      monthsWorked,
    };
  };

  if (input.grossUp) {
    for (let i = 0; i < 24; i++) {
      const trial = finish(bruto, tunjanganPph);
      const nextTunj = Math.max(0, trial.pphTerutang);
      const nextBruto = roundDown(baseTeratur + nextTunj + irregular);
      if (nextTunj === tunjanganPph && nextBruto === bruto) {
        return { ...trial, tunjanganPph: nextTunj };
      }
      tunjanganPph = nextTunj;
      bruto = nextBruto;
    }
  }

  return finish(bruto, tunjanganPph);
}

export type NonPermanentInput = {
  kodeObjekPajak: string;
  ptkp: string;
  penghasilan: number;
  punyaNpwp: boolean;
};

export type NonPermanentResult = {
  namaObjek: string;
  deemed: number;
  jenisTarif: TarifKind | number;
  dpp: number;
  tarif: number;
  pph: number;
};

export function calculateNonPermanent(input: NonPermanentInput): NonPermanentResult {
  const objek = findObjek(input.kodeObjekPajak);
  const deemed = objek?.deemed ?? 100;
  const jenis = objek?.tarif ?? "PS17";
  const dpp = input.penghasilan * (deemed / 100);
  let tarif = 0;
  let pph = 0;

  if (jenis === "TER") {
    const cat = terCategory(input.ptkp);
    tarif = lookupTerRate(cat, dpp);
    pph = roundTo(dpp * tarif);
  } else if (jenis === "HARIAN") {
    tarif = lookupTerHarian(dpp);
    if (tarif === 0 && dpp > 2_500_000) {
      const dppPs = dpp * 0.5;
      pph = pphPasal17(roundDownThousands(dppPs));
      tarif = dpp > 0 ? pph / dpp : 0;
    } else {
      pph = roundTo(dpp * tarif);
    }
  } else if (jenis === "PESANGON") {
    pph = pphPesangon(dpp);
    tarif = dpp > 0 ? pph / dpp : 0;
  } else if (jenis === "PENSIUN") {
    pph = pphPensiunSekaligus(dpp);
    tarif = dpp > 0 ? pph / dpp : 0;
  } else if (jenis === "PS17") {
    pph = pphPasal17(roundDownThousands(dpp));
    tarif = dpp > 0 ? pph / dpp : 0;
  } else if (typeof jenis === "number") {
    tarif = jenis / 100;
    pph = roundTo(dpp * tarif);
  }

  if (!input.punyaNpwp && jenis !== "PESANGON" && jenis !== "PENSIUN") {
    pph = roundTo(pph * 1.2);
  }

  return {
    namaObjek: objek?.nama ?? input.kodeObjekPajak,
    deemed,
    jenisTarif: jenis,
    dpp,
    tarif,
    pph,
  };
}

export const PASAL_17_BRACKETS = [
  { min: 0, max: 60_000_000, rate: 0.05, label: "0 – 60 juta" },
  { min: 60_000_000, max: 250_000_000, rate: 0.15, label: "60 – 250 juta" },
  { min: 250_000_000, max: 500_000_000, rate: 0.25, label: "250 – 500 juta" },
  { min: 500_000_000, max: 5_000_000_000, rate: 0.3, label: "500 juta – 5 miliar" },
  { min: 5_000_000_000, max: Number.POSITIVE_INFINITY, rate: 0.35, label: "di atas 5 miliar" },
] as const;
