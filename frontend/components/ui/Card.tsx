import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Slightly elevated surface — use for list items, nested content */
  raised?: boolean;
  /** Remove all padding */
  noPadding?: boolean;
}

export function Card({ raised, noPadding, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border transition-colors duration-150",
        raised ? "bg-surface-raised border-border-strong" : "bg-surface border-border",
        noPadding ? "" : "p-4",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
