# Advanced Export Tools Plugin

Export your IDEAGO canvas in multiple formats with one click. Supports Markdown, JSON, and PDF outline exports.

## Features

- **Markdown Export** — Converts canvas nodes into a structured `.md` document with headings and content
- **JSON Export** — Full data export with node positions, sizes, and content for programmatic use
- **PDF Outline Export** — Text-based page outline suitable for PDF generation tools
- **Format Picker UI** — Clean modal overlay for selecting export format
- **Auto-download** — Files download instantly via browser-native Blob API

## Installation

1. Open IDEAGO and navigate to **Settings > Plugins**
2. Click **Add Plugin from URL**
3. Enter: `https://github.com/jaeha81/JH-IDEAGO/tree/main/plugins/export-tools`
4. Click **Install** and reload

Or manually copy the `plugins/export-tools/` directory into your IDEAGO plugins folder.

## Usage

1. Click the **Export+** button in the toolbar
2. A format picker modal appears
3. Select your desired format (Markdown, JSON, or PDF Outline)
4. The file downloads automatically

## Export Format Details

### Markdown (.md)
- Short text nodes become `## Section` headings
- Long text nodes become body paragraphs
- Image nodes become `![Image](url)` references
- Agent response nodes are quoted with agent ID

### JSON (.json)
- Full structured data with positions and sizes
- Includes export timestamp and node count
- Suitable for re-importing or data analysis

### PDF Outline (.txt)
- Page-based outline with `[H]` header markers
- Nodes grouped into pages by vertical position
- Ready for conversion to PDF via external tools

## Configuration

This plugin has no configurable settings. It reads the current canvas state on each export.

## Permissions

- `canvas.read` — Read canvas nodes for export
- `ui.toolbar` — Add the Export+ toolbar button
- `export.hook` — Hook into the export pipeline

## Screenshots

> _Screenshots will be added after UI finalization._

| View | Description |
|------|-------------|
| ![Toolbar Button](screenshots/toolbar.png) | Export+ button in toolbar |
| ![Format Picker](screenshots/picker.png) | Export format selection modal |

## Development

```bash
# Source is in src/index.ts
# Built output is in dist/index.js
# No build step required — dist/index.js is hand-crafted
```

## License

Part of the IDEAGO project. See root LICENSE for details.
