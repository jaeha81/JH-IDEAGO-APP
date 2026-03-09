"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-white text-[#0F0F0F] hover:bg-neutral-200 active:bg-neutral-300 font-medium",
  secondary:
    "bg-surface border border-border text-white hover:bg-surface-raised hover:border-border-strong active:bg-surface-overlay",
  ghost:
    "bg-transparent text-text-secondary hover:text-white hover:bg-white/5 active:bg-white/10",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 active:bg-danger/30",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, className = "", ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center gap-2 transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-1 focus:ring-offset-[#0F0F0F]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {loading && <Spinner size={size === "lg" ? "md" : "sm"} />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

// Inline spinner to avoid circular import
function Spinner({ size }: { size: "sm" | "md" }) {
  const s = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <span
      className={`${s} animate-spin rounded-full border-2 border-current border-t-transparent`}
      aria-hidden="true"
    />
  );
}
