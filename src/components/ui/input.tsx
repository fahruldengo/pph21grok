import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full rounded-[14px] border border-white/55 bg-white/45 px-3 text-[15px] text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] backdrop-blur-xl placeholder:text-subtle outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent/50 focus:ring-2 focus:ring-accent/25";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClass, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldClass, "h-auto min-h-[88px] py-2", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-[13px] font-medium text-muted", className)} {...props} />
  );
}

export function Field({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("relative z-10", className)}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

export function MoneyInput({
  value,
  onChange,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
        Rp
      </span>
      <Input
        inputMode="numeric"
        className={cn("pl-10 tabular-nums", className)}
        value={value ? String(Math.round(value)) : ""}
        onChange={(e) => onChange(Number(String(e.target.value).replace(/[^\d]/g, "")) || 0)}
        {...props}
      />
    </div>
  );
}
