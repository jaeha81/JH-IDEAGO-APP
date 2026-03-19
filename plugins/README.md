# IDEAGO Plugin Development Guide

## File Structure

```
plugins/my-plugin/
├── plugin.json          # Manifest — required
├── src/
│   └── index.ts         # Source entry point
├── dist/
│   └── index.js         # Bundled output — single file, no imports
├── package.json         # Dev dependencies only (bundler, TypeScript)
└── tsconfig.json
```

## plugin.json

Every plugin must include a `plugin.json` at its root:

```json
{
  "id": "ideago-my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": "Your Name",
  "minAppVersion": "1.0.0",
  "entry": "dist/index.js",
  "permissions": ["canvas.read", "storage.read"],
  "githubRepo": "jaeha81/JH-IDEAGO",
  "pluginPath": "plugins/my-plugin",
  "tags": ["utility"],
  "size": "8KB"
}
```

**Required fields:** `id`, `name`, `version`, `entry`.

**Permissions** (request only what you need):

| Permission | Access |
|---|---|
| `canvas.read` | Read nodes and selection |
| `canvas.write` | Modify canvas elements |
| `agent.call` | Invoke AI agent APIs |
| `storage.read` | Read plugin-scoped storage |
| `storage.write` | Write plugin-scoped storage |
| `ui.sidebar` | Register sidebar panels |
| `ui.toolbar` | Register toolbar buttons |
| `ui.modal` | Open modal dialogs |
| `export.hook` | Hook into export pipeline |
| `network` | Make external HTTP requests |

## Writing activate() and deactivate()

Your `dist/index.js` must assign to `module.exports`:

```typescript
// src/index.ts
import type { PluginContext, UIExtension } from "../../frontend/lib/plugin-api";

const plugin = {
  manifest: require("../plugin.json"),

  async activate(ctx: PluginContext): Promise<UIExtension[]> {
    // Called when the user enables this plugin.
    // Return UI extensions you want to register.
    // DO NOT make network calls here — keep activation under 200ms.

    ctx.on("canvas:change", (payload) => {
      console.log("Canvas changed:", payload);
    });

    return [
      {
        type: "sidebar-panel",
        label: "My Panel",
        icon: "puzzle",
        render: () => null, // Return your React component here
      },
    ];
  },

  async deactivate(): Promise<void> {
    // Called when the user disables or uninstalls.
    // Clean up event listeners, timers, and DOM mutations.
  },
};

module.exports = plugin;
module.exports.default = plugin;
```

## Using PluginContext

### Storage

Scoped per-plugin — keys are automatically namespaced.

```typescript
async activate(ctx: PluginContext) {
  await ctx.storage.set("lastRun", new Date().toISOString());
  const lastRun = await ctx.storage.get("lastRun");
  await ctx.storage.remove("lastRun");
  return [];
}
```

### Canvas

Read-only access to canvas nodes and selection:

```typescript
async activate(ctx: PluginContext) {
  const allNodes = ctx.canvas.getNodes();
  const selected = ctx.canvas.getSelection();

  ctx.canvas.on("select", (nodes) => {
    console.log("Selected:", nodes.length, "nodes");
  });

  ctx.canvas.on("change", (nodes) => {
    console.log("Canvas updated");
  });

  return [];
}
```

### Events

Communicate with the host app and other plugins:

```typescript
async activate(ctx: PluginContext) {
  // Listen for events
  ctx.on("theme:change", (payload) => {
    console.log("Theme changed to:", payload);
  });

  // Emit events
  ctx.emit("my-plugin:ready", { version: ctx.manifest.version });

  return [];
}
```

## Registering UI Extensions

### Sidebar Panel

```typescript
return [
  {
    type: "sidebar-panel",
    label: "Templates",
    icon: "layout-template",
    render: () => {
      // Return a React element.
      // You have access to ctx via closure.
      return null;
    },
  },
];
```

### Toolbar Button

```typescript
return [
  {
    type: "toolbar-button",
    label: "Export PDF",
    icon: "file-down",
    render: () => null,
  },
];
```

### Context Menu Item

```typescript
return [
  {
    type: "context-menu-item",
    label: "Copy as Markdown",
    render: () => null,
  },
];
```

## Build Process

Plugins must produce a single `dist/index.js` with no external imports.

### Recommended setup (esbuild)

```bash
npm init -y
npm install --save-dev esbuild typescript
```

`package.json` scripts:

```json
{
  "scripts": {
    "build": "esbuild src/index.ts --bundle --format=cjs --outfile=dist/index.js --platform=browser --target=es2020",
    "watch": "esbuild src/index.ts --bundle --format=cjs --outfile=dist/index.js --platform=browser --target=es2020 --watch"
  }
}
```

Build:

```bash
npm run build
```

The output must be:
- **CommonJS** format (`module.exports`)
- **Single file** — no `import` or `require` of external packages
- Target: **ES2020** (Capacitor WebView baseline)

## Publishing to the Official Registry

1. Fork `jaeha81/JH-IDEAGO`
2. Create your plugin directory under `plugins/`
3. Include `plugin.json`, `src/`, and `dist/index.js`
4. Add your plugin entry to `plugins/registry/index.json`
5. Open a PR to the `main` branch

Your PR will be reviewed for:
- Correct `plugin.json` fields
- Bundle size within limits
- No malicious code patterns
- Working `activate()` / `deactivate()` lifecycle

## Performance Constraints

| Constraint | Limit |
|---|---|
| Bundle size | ≤ 50KB |
| Activation time | ≤ 200ms |
| Network calls on init | 0 (none allowed in `activate()`) |
| DOM mutations | Must be cleaned up in `deactivate()` |
| Memory leaks | All listeners must be removed on deactivate |

Plugins that exceed these limits may be rejected from the official registry or disabled at runtime.
