import { PluginManager } from "@/components/plugin-manager/PluginManager";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
      <div className="mb-10 max-w-3xl">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Account and application preferences.
        </p>
      </div>

      <div className="max-w-xl space-y-10">
        <div className="space-y-4">
          {PLANNED_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-border bg-surface px-5 py-4"
            >
              <p className="text-sm font-medium text-white">{section.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{section.description}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-raised border border-border text-[10px] text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                Not yet implemented
              </span>
            </div>
          ))}
        </div>

        <hr className="border-border" />

        <PluginManager />
      </div>
    </div>
  );
}

const PLANNED_SECTIONS = [
  {
    title: "Profile",
    description: "Display name and email address.",
  },
  {
    title: "Security",
    description: "Password change and session management.",
  },
  {
    title: "AI Model",
    description: "Select Claude model for agent queries (Haiku / Sonnet / Opus).",
  },
  {
    title: "Appearance",
    description: "Theme preferences (dark is default).",
  },
  {
    title: "Data & Privacy",
    description: "Export account data, delete account.",
  },
];
