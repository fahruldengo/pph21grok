import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function num(value: unknown): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function roundDown(value: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.floor((value + Number.EPSILON) * f) / f;
}

export function roundTo(value: number): number {
  return Math.round(value);
}

export function roundDownThousands(value: number): number {
  if (value <= 0) return 0;
  return Math.floor(value / 1000) * 1000;
}
