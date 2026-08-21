import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:bg-ink shadow-[0_1px_0_rgb(255_255_255/0.12)_inset]",
        secondary:
          "bg-elevated text-fg border border-border hover:border-border-strong hover:bg-surface",
        ghost: "text-fg hover:bg-accent-soft",
        danger: "bg-danger text-accent-fg hover:opacity-90",
        outline: "border border-border bg-transparent hover:bg-accent-soft",
      },
      size: {
        sm: "h-8 rounded-[8px] px-3 text-sm",
        md: "h-10 rounded-[10px] px-4 text-sm",
        lg: "h-11 rounded-[12px] px-5 text-base",
        icon: "size-10 rounded-[10px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
