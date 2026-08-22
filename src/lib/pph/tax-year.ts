import { useEffect, useState } from "react";

export const TAX_YEAR_KEY = "pajak21.tahun";
export const TAX_YEAR_EVENT = "pajak21-tahun";

export function yearOptions(anchor = 2026): number[] {
  const now = new Date().getFullYear();
  const start = Math.min(2020, now - 5, anchor - 5);
  const end = Math.max(2040, now + 10, anchor + 10);
  const years: number[] = [];
  for (let y = start; y <= end; y += 1) years.push(y);
  if (!years.includes(anchor)) {
    years.push(anchor);
    years.sort((a, b) => a - b);
  }
  return years;
}

export function readTaxYear(): number | null {
  try {
    const n = Number(localStorage.getItem(TAX_YEAR_KEY));
    if (Number.isInteger(n) && n >= 2000 && n <= 2100) return n;
  } catch {
    /* ignore */
  }
  return null;
}

export function useTaxYear(fallback: number) {
  const [tahun, setTahunState] = useState(() => readTaxYear() ?? fallback);

  useEffect(() => {
    if (readTaxYear() == null) setTahunState(fallback);
  }, [fallback]);

  useEffect(() => {
    const sync = () => {
      const stored = readTaxYear();
      if (stored != null) setTahunState(stored);
    };
    window.addEventListener(TAX_YEAR_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TAX_YEAR_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function setTahun(next: number) {
    const y = Math.round(next);
    try {
      localStorage.setItem(TAX_YEAR_KEY, String(y));
    } catch {
      /* ignore */
    }
    setTahunState(y);
    window.dispatchEvent(new Event(TAX_YEAR_EVENT));
  }

  return { tahun, setTahun };
}
