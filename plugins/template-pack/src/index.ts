/**
 * IDEAGO Plugin: Project Templates
 * Public plugin API — sidebar panel with 6 canvas template presets.
 */

interface TemplateNode {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: { text: string };
}

interface Template {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  nodes: TemplateNode[];
}

const TEMPLATES: Template[] = [
  {
    id: 'startup-pitch',
    name: 'Startup Pitch',
    icon: '🚀',
    color: '#F59E0B',
    description: 'Problem, solution, market, and business model',
    nodes: [
      { type: 'text', x: 100, y: 100, width: 300, height: 80, data: { text: 'Problem Statement\n\nWhat pain point are you solving? Who experiences it?' } },
      { type: 'text', x: 450, y: 100, width: 300, height: 80, data: { text: 'Solution\n\nHow does your product solve this problem uniquely?' } },
      { type: 'text', x: 100, y: 250, width: 300, height: 80, data: { text: 'Target Market\n\nWho are your customers? TAM / SAM / SOM?' } },
      { type: 'text', x: 450, y: 250, width: 300, height: 80, data: { text: 'Business Model\n\nHow will you make money? Pricing strategy?' } },
      { type: 'text', x: 100, y: 400, width: 300, height: 80, data: { text: 'Competitive Advantage\n\nWhat moat do you have? Why now?' } },
      { type: 'text', x: 450, y: 400, width: 300, height: 80, data: { text: 'Traction & Milestones\n\nKey metrics, timeline, and next steps' } },
    ],
  },
  {
    id: 'feature-spec',
    name: 'Feature Spec',
    icon: '📋',
    color: '#3B82F6',
    description: 'User stories, requirements, and acceptance criteria',
    nodes: [
      { type: 'text', x: 100, y: 100, width: 300, height: 80, data: { text: 'Feature Title\n\nOne-line description of the feature' } },
      { type: 'text', x: 450, y: 100, width: 300, height: 100, data: { text: 'User Stories\n\nAs a [user], I want [action] so that [benefit]' } },
      { type: 'text', x: 100, y: 250, width: 300, height: 100, data: { text: 'Requirements\n\n- Functional requirements\n- Non-functional requirements\n- Constraints' } },
      { type: 'text', x: 450, y: 250, width: 300, height: 100, data: { text: 'Acceptance Criteria\n\n- Given [context]\n- When [action]\n- Then [result]' } },
      { type: 'text', x: 100, y: 420, width: 300, height: 80, data: { text: 'Technical Notes\n\nArchitecture, APIs, dependencies' } },
      { type: 'text', x: 450, y: 420, width: 300, height: 80, data: { text: 'Open Questions\n\nDecisions pending, risks, unknowns' } },
    ],
  },
  {
    id: 'design-brief',
    name: 'Design Brief',
    icon: '🎨',
    color: '#EC4899',
    description: 'Visual direction, brand, audience, and deliverables',
    nodes: [
      { type: 'text', x: 100, y: 100, width: 300, height: 80, data: { text: 'Project Overview\n\nWhat needs to be designed and why?' } },
      { type: 'text', x: 450, y: 100, width: 300, height: 80, data: { text: 'Target Audience\n\nDemographics, behaviors, preferences' } },
      { type: 'text', x: 100, y: 250, width: 300, height: 100, data: { text: 'Brand Guidelines\n\n- Colors & typography\n- Tone & voice\n- Existing assets' } },
      { type: 'text', x: 450, y: 250, width: 300, height: 100, data: { text: 'Visual Direction\n\n- Style references\n- Mood board notes\n- Do\'s and don\'ts' } },
      { type: 'text', x: 100, y: 420, width: 300, height: 80, data: { text: 'Deliverables\n\nWhat files/screens/assets are expected?' } },
      { type: 'text', x: 450, y: 420, width: 300, height: 80, data: { text: 'Timeline & Budget\n\nDeadlines, review cycles, constraints' } },
    ],
  },
  {
    id: 'research-plan',
    name: 'Research Plan',
    icon: '🔬',
    color: '#8B5CF6',
    description: 'Hypothesis, methodology, data collection plan',
    nodes: [
      { type: 'text', x: 100, y: 100, width: 300, height: 80, data: { text: 'Research Question\n\nWhat are you trying to learn or prove?' } },
      { type: 'text', x: 450, y: 100, width: 300, height: 80, data: { text: 'Hypothesis\n\nWhat do you expect to find and why?' } },
      { type: 'text', x: 100, y: 250, width: 300, height: 100, data: { text: 'Methodology\n\n- Qualitative vs quantitative\n- Sample size\n- Tools & platforms' } },
      { type: 'text', x: 450, y: 250, width: 300, height: 100, data: { text: 'Data Collection\n\n- Sources\n- Collection methods\n- Privacy considerations' } },
      { type: 'text', x: 100, y: 420, width: 300, height: 80, data: { text: 'Analysis Plan\n\nHow will data be processed and interpreted?' } },
      { type: 'text', x: 450, y: 420, width: 300, height: 80, data: { text: 'Expected Outcomes\n\nHow will findings be applied?' } },
    ],
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    icon: '📢',
    color: '#EF4444',
    description: 'Goals, channels, messaging, and KPIs',
    nodes: [
      { type: 'text', x: 100, y: 100, width: 300, height: 80, data: { text: 'Campaign Goal\n\nWhat outcome are you driving?' } },
      { type: 'text', x: 450, y: 100, width: 300, height: 80, data: { text: 'Target Audience\n\nSegments, personas, demographics' } },
      { type: 'text', x: 100, y: 250, width: 300, height: 100, data: { text: 'Key Messaging\n\n- Value proposition\n- Tagline\n- Call to action' } },
      { type: 'text', x: 450, y: 250, width: 300, height: 100, data: { text: 'Channels\n\n- Social media\n- Email\n- Paid ads\n- Content marketing' } },
      { type: 'text', x: 100, y: 420, width: 300, height: 80, data: { text: 'Timeline\n\nLaunch date, phases, milestones' } },
      { type: 'text', x: 450, y: 420, width: 300, height: 80, data: { text: 'KPIs & Budget\n\nSuccess metrics, spend allocation' } },
    ],
  },
  {
    id: 'tech-architecture',
    name: 'Technical Architecture',
    icon: '🏗️',
    color: '#06B6D4',
    description: 'System components, data flow, and infrastructure',
    nodes: [
      { type: 'text', x: 100, y: 100, width: 300, height: 80, data: { text: 'System Overview\n\nHigh-level architecture description' } },
      { type: 'text', x: 450, y: 100, width: 300, height: 80, data: { text: 'Core Components\n\nFrontend, backend, database, services' } },
      { type: 'text', x: 100, y: 250, width: 300, height: 100, data: { text: 'Data Flow\n\n- Request lifecycle\n- Data pipeline\n- Event flow' } },
      { type: 'text', x: 450, y: 250, width: 300, height: 100, data: { text: 'Infrastructure\n\n- Hosting / cloud\n- CI/CD\n- Monitoring\n- Scaling strategy' } },
      { type: 'text', x: 100, y: 420, width: 300, height: 80, data: { text: 'Security\n\nAuth, encryption, compliance requirements' } },
      { type: 'text', x: 450, y: 420, width: 300, height: 80, data: { text: 'Tech Stack\n\nLanguages, frameworks, key libraries' } },
    ],
  },
];

function buildSidebarHTML(loadingId: string | null): string {
  return `
    <div style="padding:16px;font-family:system-ui,-apple-system,sans-serif;">
      <h3 style="margin:0 0 4px;font-size:14px;font-weight:600;color:#E5E7EB;">
        Templates
      </h3>
      <p style="margin:0 0 16px;font-size:11px;color:#6B7280;">
        Click to populate your canvas
      </p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${TEMPLATES.map((t) => `
          <button
            data-template-id="${t.id}"
            class="tpl-btn"
            style="
              display:flex;align-items:center;gap:10px;padding:12px;
              border-radius:8px;border:1px solid #374151;
              background:#1F2937;color:#E5E7EB;cursor:pointer;
              text-align:left;transition:all 0.15s ease;
              opacity:${loadingId === t.id ? '0.6' : '1'};
            "
            ${loadingId ? 'disabled' : ''}
          >
            <span style="
              width:40px;height:40px;border-radius:8px;
              background:${t.color}1A;display:flex;align-items:center;
              justify-content:center;font-size:20px;flex-shrink:0;
            ">${t.icon}</span>
            <div style="min-width:0;">
              <div style="font-weight:600;font-size:13px;">${t.name}</div>
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${loadingId === t.id ? 'Adding nodes...' : t.description}
              </div>
            </div>
          </button>
        `).join('')}
      </div>
      <div style="margin-top:16px;padding:10px;background:#1F2937;border-radius:6px;">
        <div style="font-size:11px;color:#6B7280;">Each template adds 6 structured nodes to your canvas.</div>
      </div>
    </div>
  `;
}

export default {
  async activate(ctx: any): Promise<any[]> {
    let loadingTemplateId: string | null = null;

    const sidebarExtension = {
      type: 'sidebar-panel' as const,
      label: 'Templates',
      icon: '📦',
      render(container: HTMLElement) {
        container.innerHTML = buildSidebarHTML(loadingTemplateId);

        container.querySelectorAll('.tpl-btn').forEach((btn: Element) => {
          btn.addEventListener('click', async () => {
            const templateId = (btn as HTMLElement).dataset.templateId;
            if (!templateId || loadingTemplateId) return;

            const template = TEMPLATES.find((t) => t.id === templateId);
            if (!template) return;

            loadingTemplateId = templateId;
            container.innerHTML = buildSidebarHTML(loadingTemplateId);

            for (const node of template.nodes) {
              await ctx.canvas.addNode({
                type: node.type,
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
                data: { ...node.data },
              });
            }

            loadingTemplateId = null;
            this.render(container);
          });
        });
      },
    };

    return [sidebarExtension];
  },

  async deactivate(): Promise<void> {},
};
