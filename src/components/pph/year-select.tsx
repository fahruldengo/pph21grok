import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/input";
import { yearOptions } from "@/lib/pph/tax-year";
import { cn } from "@/lib/utils";

export function YearSelect({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (year: number) => void;
  className?: string;
}) {
  const years = yearOptions(value);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full text-fg transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/45 active:scale-[0.96]"
        onClick={() => onChange(value - 1)}
        aria-label="Tahun sebelumnya"
      >
        <ChevronLeft className="size-5" />
      </button>
      <Select
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-[8.5rem] text-center font-semibold"
        aria-label="Tahun pajak"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            Tahun {y}
          </option>
        ))}
      </Select>
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full text-fg transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/45 active:scale-[0.96]"
        onClick={() => onChange(value + 1)}
        aria-label="Tahun berikutnya"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
