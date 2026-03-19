/**
 * IDEAGO Plugin: Multi AI Provider
 * Public plugin API — sidebar panel for switching AI providers.
 */

interface ProviderConfig {
  id: string;
  name: string;
  icon: string;
  models: string[];
  defaultModel: string;
  color: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    icon: '🟣',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-sonnet-4-20250514',
    color: '#7C3AED',
  },
  {
    id: 'gpt4',
    name: 'GPT-4 (OpenAI)',
    icon: '🟢',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4'],
    defaultModel: 'gpt-4o',
    color: '#10A37F',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    icon: '🔵',
    models: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-2.0-flash',
    color: '#4285F4',
  },
];

const STORAGE_KEY_PROVIDER = 'selected-provider';
const STORAGE_KEY_MODEL = 'selected-model';

let eventUnsubscribe: (() => void) | null = null;

function buildSidebarHTML(selectedProviderId: string, selectedModel: string): string {
  return `
    <div style="padding:16px;font-family:system-ui,-apple-system,sans-serif;">
      <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#E5E7EB;">
        AI Provider
      </h3>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${PROVIDERS.map((p) => {
          const isActive = p.id === selectedProviderId;
          return `
            <button
              data-provider-id="${p.id}"
              class="provider-btn"
              style="
                display:flex;align-items:center;gap:10px;
                padding:12px;border-radius:8px;border:2px solid ${isActive ? p.color : '#374151'};
                background:${isActive ? p.color + '1A' : '#1F2937'};
                color:#E5E7EB;cursor:pointer;text-align:left;
                transition:all 0.15s ease;
              "
            >
              <span style="font-size:20px;">${p.icon}</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${p.name}</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">
                  ${p.models.length} models available
                </div>
              </div>
              ${isActive ? '<span style="margin-left:auto;color:' + p.color + ';font-size:16px;">✓</span>' : ''}
            </button>
          `;
        }).join('')}
      </div>

      <div style="margin-top:20px;">
        <label style="font-size:12px;color:#9CA3AF;display:block;margin-bottom:6px;">
          Model
        </label>
        <select
          id="model-select"
          style="
            width:100%;padding:8px 10px;border-radius:6px;
            background:#1F2937;border:1px solid #374151;color:#E5E7EB;
            font-size:13px;outline:none;
          "
        >
          ${PROVIDERS.find((p) => p.id === selectedProviderId)
            ?.models.map(
              (m) =>
                `<option value="${m}" ${m === selectedModel ? 'selected' : ''}>${m}</option>`
            )
            .join('') ?? ''}
        </select>
      </div>

      <div style="margin-top:16px;padding:10px;background:#1F2937;border-radius:6px;">
        <div style="font-size:11px;color:#6B7280;">Current Configuration</div>
        <div id="config-display" style="font-size:12px;color:#D1D5DB;margin-top:4px;">
          Provider: <strong>${PROVIDERS.find((p) => p.id === selectedProviderId)?.name}</strong><br/>
          Model: <strong>${selectedModel}</strong>
        </div>
      </div>
    </div>
  `;
}

export default {
  async activate(ctx: any): Promise<any[]> {
    const storedProvider = (await ctx.storage.get(STORAGE_KEY_PROVIDER)) ?? 'claude';
    const provider = PROVIDERS.find((p) => p.id === storedProvider) ?? PROVIDERS[0];
    const storedModel =
      (await ctx.storage.get(STORAGE_KEY_MODEL)) ?? provider.defaultModel;

    let currentProviderId: string = provider.id;
    let currentModel: string = storedModel;

    eventUnsubscribe = ctx.events.on('agent.before-call', (payload: any) => {
      const activeProvider = PROVIDERS.find((p) => p.id === currentProviderId);
      if (!activeProvider) return;

      payload.providerConfig = {
        providerId: activeProvider.id,
        providerName: activeProvider.name,
        model: currentModel,
      };
    });

    const sidebarExtension = {
      type: 'sidebar-panel' as const,
      label: 'AI Providers',
      icon: '🤖',
      render(container: HTMLElement) {
        container.innerHTML = buildSidebarHTML(currentProviderId, currentModel);

        container.querySelectorAll('.provider-btn').forEach((btn: Element) => {
          btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.providerId;
            if (!id || id === currentProviderId) return;

            currentProviderId = id;
            const newProvider = PROVIDERS.find((p) => p.id === id)!;
            currentModel = newProvider.defaultModel;

            await ctx.storage.set(STORAGE_KEY_PROVIDER, currentProviderId);
            await ctx.storage.set(STORAGE_KEY_MODEL, currentModel);

            container.innerHTML = buildSidebarHTML(currentProviderId, currentModel);
            this.render(container);
          });
        });

        const modelSelect = container.querySelector('#model-select') as HTMLSelectElement | null;
        if (modelSelect) {
          modelSelect.addEventListener('change', async () => {
            currentModel = modelSelect.value;
            await ctx.storage.set(STORAGE_KEY_MODEL, currentModel);

            const display = container.querySelector('#config-display');
            if (display) {
              const p = PROVIDERS.find((pr) => pr.id === currentProviderId);
              display.innerHTML = `Provider: <strong>${p?.name}</strong><br/>Model: <strong>${currentModel}</strong>`;
            }
          });
        }
      },
    };

    return [sidebarExtension];
  },

  async deactivate(): Promise<void> {
    if (eventUnsubscribe) {
      eventUnsubscribe();
      eventUnsubscribe = null;
    }
  },
};
