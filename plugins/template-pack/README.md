# Project Templates Plugin

Instantly populate your IDEAGO canvas with pre-built project templates. Choose from 6 structured layouts covering common project types.

## Templates Included

| Template | Description |
|----------|-------------|
| **Startup Pitch** | Problem, solution, market, business model, competitive advantage, traction |
| **Feature Spec** | Feature title, user stories, requirements, acceptance criteria, tech notes |
| **Design Brief** | Project overview, audience, brand guidelines, visual direction, deliverables |
| **Research Plan** | Research question, hypothesis, methodology, data collection, analysis |
| **Marketing Campaign** | Campaign goal, audience, messaging, channels, timeline, KPIs |
| **Technical Architecture** | System overview, components, data flow, infrastructure, security, tech stack |

## Installation

1. Open IDEAGO and navigate to **Settings > Plugins**
2. Click **Add Plugin from URL**
3. Enter: `https://github.com/jaeha81/JH-IDEAGO/tree/main/plugins/template-pack`
4. Click **Install** and reload

Or manually copy the `plugins/template-pack/` directory into your IDEAGO plugins folder.

## Usage

1. Open the **Templates** panel in the sidebar
2. Click any template card
3. 6 structured nodes are added to your canvas automatically
4. Edit the placeholder text in each node to fill in your project details

## Configuration

This plugin has no configurable settings. Templates are built-in and applied directly to the canvas.

## Permissions

- `canvas.write` — Add template nodes to the canvas
- `ui.sidebar` — Render the template selection panel

## Screenshots

> _Screenshots will be added after UI finalization._

| View | Description |
|------|-------------|
| ![Template Panel](screenshots/panel.png) | Template selection sidebar |
| ![Applied Template](screenshots/canvas.png) | Canvas after applying Startup Pitch template |

## Development

```bash
# Source is in src/index.ts
# Built output is in dist/index.js
# No build step required — dist/index.js is hand-crafted
```

## License

Part of the IDEAGO project. See root LICENSE for details.
