/**
 * IDEAGO Plugin: Advanced Export Tools
 * Public plugin API — toolbar button for multi-format canvas export.
 */

interface CanvasNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: { text?: string; imageUrl?: string; agentId?: string };
}

type ExportFormat = 'markdown' | 'json' | 'pdf-outline';

const EXPORT_FORMATS: { id: ExportFormat; label: string; icon: string; ext: string }[] = [
  { id: 'markdown', label: 'Markdown (.md)', icon: 'M', ext: 'md' },
  { id: 'json', label: 'JSON (.json)', icon: '{}', ext: 'json' },
  { id: 'pdf-outline', label: 'PDF Outline (.txt)', icon: 'P', ext: 'txt' },
];

function sortNodesByPosition(nodes: CanvasNode[]): CanvasNode[] {
  return [...nodes].sort((a, b) => {
    const rowDiff = Math.round(a.y / 100) - Math.round(b.y / 100);
    if (rowDiff !== 0) return rowDiff;
    return a.x - b.x;
  });
}

function nodesToMarkdown(nodes: CanvasNode[], projectTitle: string): string {
  const sorted = sortNodesByPosition(nodes);
  const lines: string[] = [`# ${projectTitle}`, '', `> Exported from IDEAGO on ${new Date().toLocaleDateString()}`, ''];

  let sectionIndex = 1;
  for (const node of sorted) {
    if (!node.data.text && !node.data.imageUrl) continue;

    if (node.type === 'text' && node.data.text) {
      const text = node.data.text.trim();
      const isHeader = text.length < 80 && !text.includes('\n');
      if (isHeader) {
        lines.push(`## ${sectionIndex}. ${text}`, '');
        sectionIndex++;
      } else {
        lines.push(text, '');
      }
    } else if (node.type === 'image' && node.data.imageUrl) {
      lines.push(`![Image](${node.data.imageUrl})`, '');
    } else if (node.data.agentId) {
      lines.push(`> **Agent (${node.data.agentId})**: ${node.data.text ?? ''}`, '');
    }
  }

  lines.push('---', `*${nodes.length} nodes exported*`);
  return lines.join('\n');
}

function nodesToJSON(nodes: CanvasNode[], projectTitle: string): string {
  const sorted = sortNodesByPosition(nodes);
  const exportData = {
    title: projectTitle,
    exportedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    nodes: sorted.map((n) => ({
      id: n.id,
      type: n.type,
      position: { x: n.x, y: n.y },
      size: { width: n.width, height: n.height },
      content: n.data,
    })),
  };
  return JSON.stringify(exportData, null, 2);
}

function nodesToPDFOutline(nodes: CanvasNode[], projectTitle: string): string {
  const sorted = sortNodesByPosition(nodes);
  const lines: string[] = [
    `PDF OUTLINE: ${projectTitle}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    '='.repeat(50),
    '',
  ];

  let pageNum = 1;
  let currentY = -1;
  for (const node of sorted) {
    if (!node.data.text) continue;

    const row = Math.round(node.y / 200);
    if (row !== currentY) {
      currentY = row;
      lines.push(`--- Page ${pageNum} ---`);
      pageNum++;
    }

    const text = node.data.text.trim();
    const isTitle = text.length < 80 && !text.includes('\n');
    const prefix = isTitle ? '[H] ' : '    ';
    lines.push(`${prefix}${text.substring(0, 120)}${text.length > 120 ? '...' : ''}`);
  }

  lines.push('', '='.repeat(50), `Total: ${nodes.length} nodes, ${pageNum - 1} pages`);
  return lines.join('\n');
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildPickerHTML(): string {
  return `
    <div class="export-picker-overlay" style="
      position:fixed;top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.5);z-index:9999;
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="
        background:#1F2937;border-radius:12px;padding:24px;
        width:320px;box-shadow:0 20px 40px rgba(0,0,0,0.4);
        font-family:system-ui,-apple-system,sans-serif;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:16px;font-weight:600;color:#E5E7EB;">Export Canvas</h3>
          <button class="export-close-btn" style="
            background:none;border:none;color:#9CA3AF;font-size:20px;cursor:pointer;padding:4px;
          ">&times;</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${EXPORT_FORMATS.map(
            (f) => `
            <button data-format="${f.id}" class="export-fmt-btn" style="
              display:flex;align-items:center;gap:12px;padding:14px;
              border-radius:8px;border:1px solid #374151;
              background:#111827;color:#E5E7EB;cursor:pointer;
              text-align:left;transition:background 0.15s;
            ">
              <span style="
                width:36px;height:36px;border-radius:8px;
                background:#374151;display:flex;align-items:center;
                justify-content:center;font-weight:700;font-size:14px;color:#60A5FA;
              ">${f.icon}</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${f.label}</div>
              </div>
            </button>
          `
          ).join('')}
        </div>
      </div>
    </div>
  `;
}

async function performExport(format: ExportFormat, ctx: any): Promise<void> {
  const nodes: CanvasNode[] = await ctx.canvas.getNodes();
  const projectTitle = (await ctx.canvas.getTitle?.()) ?? 'IDEAGO Export';

  const converters: Record<ExportFormat, { fn: typeof nodesToMarkdown; ext: string; mime: string }> = {
    markdown: { fn: nodesToMarkdown, ext: 'md', mime: 'text/markdown' },
    json: { fn: nodesToJSON, ext: 'json', mime: 'application/json' },
    'pdf-outline': { fn: nodesToPDFOutline, ext: 'txt', mime: 'text/plain' },
  };

  const converter = converters[format];
  const content = converter.fn(nodes, projectTitle);
  const safeTitle = projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  triggerDownload(content, `${safeTitle}.${converter.ext}`, converter.mime);
}

export default {
  async activate(ctx: any): Promise<any[]> {
    const toolbarExtension = {
      type: 'toolbar-button' as const,
      label: 'Export+',
      icon: '📤',
      onClick() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = buildPickerHTML();
        document.body.appendChild(wrapper);

        const overlay = wrapper.querySelector('.export-picker-overlay') as HTMLElement;

        const cleanup = () => {
          if (wrapper.parentNode) document.body.removeChild(wrapper);
        };

        overlay?.addEventListener('click', (e: Event) => {
          if (e.target === overlay) cleanup();
        });

        wrapper.querySelector('.export-close-btn')?.addEventListener('click', cleanup);

        wrapper.querySelectorAll('.export-fmt-btn').forEach((btn: Element) => {
          btn.addEventListener('click', async () => {
            const format = (btn as HTMLElement).dataset.format as ExportFormat;
            cleanup();
            await performExport(format, ctx);
          });
        });
      },
    };

    return [toolbarExtension];
  },

  async deactivate(): Promise<void> {
    const leftover = document.querySelector('.export-picker-overlay');
    if (leftover?.parentElement) {
      leftover.parentElement.remove();
    }
  },
};
