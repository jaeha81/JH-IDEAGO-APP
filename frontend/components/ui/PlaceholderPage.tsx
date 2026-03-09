// PlaceholderPage — reusable scaffold for routes that are not yet implemented.
// Renders a labelled, navigable stub that never crashes.
// Replace with real content during feature implementation steps.

interface PlaceholderPageProps {
  title: string;
  description?: string;
  /** If true, fills the entire available height (for workspace sub-pages) */
  fill?: boolean;
}

export function PlaceholderPage({
  title,
  description,
  fill = false,
}: PlaceholderPageProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-3 text-center px-6",
        fill ? "flex-1 h-full" : "min-h-[60vh]",
      ].join(" ")}
      aria-label={`${title} — not yet implemented`}
    >
      {/* Visual cue */}
      <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-muted mb-1">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="2" y="2" width="16" height="16" rx="2" />
          <path d="M6 10h8M10 6v8" />
        </svg>
      </div>

      <p className="text-base font-semibold text-white">{title}</p>

      {description && (
        <p className="text-sm text-text-secondary max-w-xs">{description}</p>
      )}

      {/* Scaffold tag — remove once real content is in place */}
      <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-[11px] text-text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
        Placeholder — implementation pending
      </span>
    </div>
  );
}
