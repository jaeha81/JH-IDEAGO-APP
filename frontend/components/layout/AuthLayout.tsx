interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6">
      {/* Brand mark */}
      <div className="mb-10 text-center">
        <p className="text-3xl font-semibold tracking-tight text-white">IDEAGO</p>
        <p className="text-xs text-text-secondary mt-1">(MultiGenius)</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-surface border border-border p-8">
        <h1 className="text-xl font-semibold text-white mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mb-6">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>

      {/* Tagline */}
      <p className="mt-8 text-center text-xs text-text-muted max-w-xs">
        Empowering your ideas with multi-genius collaboration
      </p>
    </div>
  );
}
