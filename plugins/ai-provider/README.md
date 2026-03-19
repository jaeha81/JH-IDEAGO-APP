# Multi AI Provider Plugin

Switch between AI providers directly from the IDEAGO sidebar. Supports **Claude**, **GPT-4**, and **Gemini** with model selection and persistent configuration.

## Features

- **Provider Switching** — One-click switching between Claude (Anthropic), GPT-4 (OpenAI), and Gemini (Google)
- **Model Selection** — Choose specific models within each provider (e.g., claude-sonnet-4-20250514, gpt-4o, gemini-2.0-flash)
- **Persistent Storage** — Your selection is saved across sessions via plugin storage
- **Agent Integration** — Automatically injects provider config into agent calls via `agent.before-call` event hook

## Installation

1. Open IDEAGO and navigate to **Settings > Plugins**
2. Click **Add Plugin from URL**
3. Enter: `https://github.com/jaeha81/JH-IDEAGO/tree/main/plugins/ai-provider`
4. Click **Install** and reload

Or manually copy the `plugins/ai-provider/` directory into your IDEAGO plugins folder.

## Usage

Once installed, a new **AI Providers** panel appears in the sidebar.

1. Click any provider card to switch to it
2. Use the dropdown to select a specific model
3. The "Current Configuration" section shows your active selection
4. All subsequent agent calls will automatically use your selected provider

## Configuration

| Setting | Storage Key | Default | Description |
|---------|-------------|---------|-------------|
| Provider | `selected-provider` | `claude` | Active AI provider ID |
| Model | `selected-model` | `claude-sonnet-4-20250514` | Active model within provider |

## Permissions

- `agent.call` — Hook into agent call lifecycle
- `storage.read` / `storage.write` — Persist provider selection
- `ui.sidebar` — Render the provider panel

## Screenshots

> _Screenshots will be added after UI finalization._

| View | Description |
|------|-------------|
| ![Sidebar Panel](screenshots/sidebar.png) | Provider selection panel |
| ![Model Picker](screenshots/models.png) | Model dropdown for each provider |

## Development

```bash
# Source is in src/index.ts
# Built output is in dist/index.js
# No build step required — dist/index.js is hand-crafted
```

## License

Part of the IDEAGO project. See root LICENSE for details.
