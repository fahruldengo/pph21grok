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
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative z-10", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
