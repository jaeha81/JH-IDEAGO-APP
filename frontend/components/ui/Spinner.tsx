type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export function Spinner({ size = "md", className = "", label = "Loading…" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-block animate-spin rounded-full border-white/20 border-t-white",
        sizeClasses[size],
        className,
      ].join(" ")}
    />
  );
}

interface SpinnerOverlayProps {
  label?: string;
}

export function SpinnerOverlay({ label = "Loading…" }: SpinnerOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0F0F0F]/60 backdrop-blur-sm z-50">
      <Spinner size="lg" />
      {label && <p className="text-sm text-text-secondary">{label}</p>}
    </div>
  );
}
