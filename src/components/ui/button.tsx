import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-tight transition-[transform,background-color,box-shadow,opacity] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-[0.96]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_8px_20px_rgb(0_122_255/0.28)] hover:brightness-110",
        secondary:
          "border border-white/60 bg-white/45 text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] backdrop-blur-xl hover:bg-white/60",
        ghost: "text-fg hover:bg-white/35",
        danger: "bg-danger text-accent-fg hover:brightness-110",
        outline: "border border-white/50 bg-transparent hover:bg-white/35",
      },
      size: {
        sm: "h-8 rounded-full px-3 text-sm",
        md: "h-11 rounded-full px-5 text-[15px]",
        lg: "h-12 rounded-full px-6 text-base",
        icon: "size-11 rounded-full",
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
