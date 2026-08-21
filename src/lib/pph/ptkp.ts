export const PTKP_STATUSES = [
  "TK/0",
  "TK/1",
  "TK/2",
  "TK/3",
  "K/0",
  "K/1",
  "K/2",
  "K/3",
  "K/I/0",
  "K/I/1",
  "K/I/2",
  "K/I/3",
] as const;

export type PtkpStatus = (typeof PTKP_STATUSES)[number];

const BASE = 54_000_000;
const ADD = 4_500_000;

export const PTKP_YEARLY: Record<string, number> = {
  "TK/0": BASE,
  "TK/1": BASE + ADD,
  "TK/2": BASE + ADD * 2,
  "TK/3": BASE + ADD * 3,
  "K/0": BASE + ADD,
  "K/1": BASE + ADD * 2,
  "K/2": BASE + ADD * 3,
  "K/3": BASE + ADD * 4,
  "K/I/0": BASE + BASE + ADD,
  "K/I/1": BASE + BASE + ADD * 2,
  "K/I/2": BASE + BASE + ADD * 3,
  "K/I/3": BASE + BASE + ADD * 4,
  "HB/0": BASE,
  "HB/1": BASE + ADD,
  "HB/2": BASE + ADD * 2,
  "HB/3": BASE + ADD * 3,
};

export function ptkpYearly(status: string): number {
  return PTKP_YEARLY[status.trim().toUpperCase()] ?? BASE;
}

export function ptkpMonthly(status: string): number {
  return ptkpYearly(status) / 12;
}

export const PTKP_LABELS: Record<string, string> = {
  "TK/0": "Tidak kawin, tanpa tanggungan",
  "TK/1": "Tidak kawin, 1 tanggungan",
  "TK/2": "Tidak kawin, 2 tanggungan",
  "TK/3": "Tidak kawin, 3 tanggungan",
  "K/0": "Kawin, tanpa tanggungan",
  "K/1": "Kawin, 1 tanggungan",
  "K/2": "Kawin, 2 tanggungan",
  "K/3": "Kawin, 3 tanggungan",
  "K/I/0": "Kawin, penghasilan istri digabung, 0 tanggungan",
  "K/I/1": "Kawin, penghasilan istri digabung, 1 tanggungan",
  "K/I/2": "Kawin, penghasilan istri digabung, 2 tanggungan",
  "K/I/3": "Kawin, penghasilan istri digabung, 3 tanggungan",
};
