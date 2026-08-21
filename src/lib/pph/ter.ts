export type TerCategory = "TER A" | "TER B" | "TER C";

export type TerBracket = { max: number; rate: number };

const INF = Number.POSITIVE_INFINITY;

export const TER_A: TerBracket[] = [
  { max: 5_400_000, rate: 0 },
  { max: 5_650_000, rate: 0.0025 },
  { max: 5_950_000, rate: 0.005 },
  { max: 6_300_000, rate: 0.0075 },
  { max: 6_750_000, rate: 0.01 },
  { max: 7_500_000, rate: 0.0125 },
  { max: 8_550_000, rate: 0.015 },
  { max: 9_650_000, rate: 0.0175 },
  { max: 10_050_000, rate: 0.02 },
  { max: 10_350_000, rate: 0.0225 },
  { max: 10_700_000, rate: 0.025 },
  { max: 11_050_000, rate: 0.03 },
  { max: 11_600_000, rate: 0.035 },
  { max: 12_500_000, rate: 0.04 },
  { max: 13_750_000, rate: 0.05 },
  { max: 15_100_000, rate: 0.06 },
  { max: 16_950_000, rate: 0.07 },
  { max: 19_750_000, rate: 0.08 },
  { max: 24_150_000, rate: 0.09 },
  { max: 26_450_000, rate: 0.1 },
  { max: 28_000_000, rate: 0.11 },
  { max: 30_050_000, rate: 0.12 },
  { max: 32_400_000, rate: 0.13 },
  { max: 35_400_000, rate: 0.14 },
  { max: 39_100_000, rate: 0.15 },
  { max: 43_850_000, rate: 0.16 },
  { max: 47_800_000, rate: 0.17 },
  { max: 51_400_000, rate: 0.18 },
  { max: 56_300_000, rate: 0.19 },
  { max: 62_200_000, rate: 0.2 },
  { max: 68_600_000, rate: 0.21 },
  { max: 77_500_000, rate: 0.22 },
  { max: 89_000_000, rate: 0.23 },
  { max: 103_000_000, rate: 0.24 },
  { max: 125_000_000, rate: 0.25 },
  { max: 157_000_000, rate: 0.26 },
  { max: 206_000_000, rate: 0.27 },
  { max: 337_000_000, rate: 0.28 },
  { max: 454_000_000, rate: 0.29 },
  { max: 550_000_000, rate: 0.3 },
  { max: 695_000_000, rate: 0.31 },
  { max: 910_000_000, rate: 0.32 },
  { max: 1_400_000_000, rate: 0.33 },
  { max: INF, rate: 0.34 },
];

export const TER_B: TerBracket[] = [
  { max: 6_200_000, rate: 0 },
  { max: 6_500_000, rate: 0.0025 },
  { max: 6_850_000, rate: 0.005 },
  { max: 7_300_000, rate: 0.0075 },
  { max: 9_200_000, rate: 0.01 },
  { max: 10_750_000, rate: 0.015 },
  { max: 11_250_000, rate: 0.02 },
  { max: 11_600_000, rate: 0.025 },
  { max: 12_600_000, rate: 0.03 },
  { max: 13_600_000, rate: 0.04 },
  { max: 14_950_000, rate: 0.05 },
  { max: 16_400_000, rate: 0.06 },
  { max: 18_450_000, rate: 0.07 },
  { max: 21_850_000, rate: 0.08 },
  { max: 26_000_000, rate: 0.09 },
  { max: 27_700_000, rate: 0.1 },
  { max: 29_350_000, rate: 0.11 },
  { max: 31_450_000, rate: 0.12 },
  { max: 33_950_000, rate: 0.13 },
  { max: 37_100_000, rate: 0.14 },
  { max: 41_100_000, rate: 0.15 },
  { max: 45_800_000, rate: 0.16 },
  { max: 49_500_000, rate: 0.17 },
  { max: 53_800_000, rate: 0.18 },
  { max: 58_500_000, rate: 0.19 },
  { max: 64_000_000, rate: 0.2 },
  { max: 71_000_000, rate: 0.21 },
  { max: 80_000_000, rate: 0.22 },
  { max: 93_000_000, rate: 0.23 },
  { max: 109_000_000, rate: 0.24 },
  { max: 129_000_000, rate: 0.25 },
  { max: 163_000_000, rate: 0.26 },
  { max: 211_000_000, rate: 0.27 },
  { max: 374_000_000, rate: 0.28 },
  { max: 459_000_000, rate: 0.29 },
  { max: 555_000_000, rate: 0.3 },
  { max: 704_000_000, rate: 0.31 },
  { max: 957_000_000, rate: 0.32 },
  { max: 1_405_000_000, rate: 0.33 },
  { max: INF, rate: 0.34 },
];

export const TER_C: TerBracket[] = [
  { max: 6_600_000, rate: 0 },
  { max: 6_950_000, rate: 0.0025 },
  { max: 7_350_000, rate: 0.005 },
  { max: 7_800_000, rate: 0.0075 },
  { max: 8_850_000, rate: 0.01 },
  { max: 9_800_000, rate: 0.0125 },
  { max: 10_950_000, rate: 0.015 },
  { max: 11_200_000, rate: 0.0175 },
  { max: 12_050_000, rate: 0.02 },
  { max: 12_950_000, rate: 0.03 },
  { max: 14_150_000, rate: 0.04 },
  { max: 15_550_000, rate: 0.05 },
  { max: 17_050_000, rate: 0.06 },
  { max: 19_500_000, rate: 0.07 },
  { max: 22_700_000, rate: 0.08 },
  { max: 26_600_000, rate: 0.09 },
  { max: 28_100_000, rate: 0.1 },
  { max: 30_100_000, rate: 0.11 },
  { max: 32_600_000, rate: 0.12 },
  { max: 35_400_000, rate: 0.13 },
  { max: 38_900_000, rate: 0.14 },
  { max: 43_000_000, rate: 0.15 },
  { max: 47_400_000, rate: 0.16 },
  { max: 51_200_000, rate: 0.17 },
  { max: 55_800_000, rate: 0.18 },
  { max: 60_400_000, rate: 0.19 },
  { max: 66_700_000, rate: 0.2 },
  { max: 74_500_000, rate: 0.21 },
  { max: 83_200_000, rate: 0.22 },
  { max: 95_600_000, rate: 0.23 },
  { max: 110_000_000, rate: 0.24 },
  { max: 134_000_000, rate: 0.25 },
  { max: 169_000_000, rate: 0.26 },
  { max: 221_000_000, rate: 0.27 },
  { max: 390_000_000, rate: 0.28 },
  { max: 463_000_000, rate: 0.29 },
  { max: 561_000_000, rate: 0.3 },
  { max: 709_000_000, rate: 0.31 },
  { max: 965_000_000, rate: 0.32 },
  { max: 1_419_000_000, rate: 0.33 },
  { max: INF, rate: 0.34 },
];

export const TER_TABLES: Record<TerCategory, TerBracket[]> = {
  "TER A": TER_A,
  "TER B": TER_B,
  "TER C": TER_C,
};

const CAT_A = new Set(["TK/0", "TK/1", "K/0", "HB/0", "HB/1"]);
const CAT_B = new Set(["TK/2", "TK/3", "K/1", "K/2", "HB/2", "HB/3"]);
const CAT_C = new Set(["K/3", "K/I/0", "K/I/1", "K/I/2", "K/I/3"]);

export function terCategory(ptkp: string): TerCategory {
  const key = ptkp.trim().toUpperCase();
  if (CAT_C.has(key)) return "TER C";
  if (CAT_B.has(key)) return "TER B";
  if (CAT_A.has(key)) return "TER A";
  return "TER A";
}

export function lookupTerRate(category: TerCategory, bruto: number): number {
  if (bruto <= 0) return 0;
  const table = TER_TABLES[category];
  for (const row of table) {
    if (bruto <= row.max) return row.rate;
  }
  return table[table.length - 1]?.rate ?? 0;
}

export function lookupTerHarian(dpp: number): number {
  if (dpp <= 450_000) return 0;
  if (dpp <= 2_500_000) return 0.005;
  return 0;
}
