# IDEAGO Performance Guidelines

> These guidelines apply to all frontend development, plugin development, and any UI contribution to IDEAGO.

---

## 1. No Unnecessary Images or Animations

- **No decorative images**: Icons must be SVG inline only. No PNG/JPG for UI chrome.
- **No CSS animations for non-functional elements**: Transitions only when they convey state changes (e.g., loading → loaded, collapsed → expanded). Never pure decoration.
- **Lottie / GIF / video backgrounds**: Strictly forbidden.
- **Canvas drawing**: Use `requestAnimationFrame` — never `setInterval` for rendering loops.
- **Image uploads from users**: Lazy-load with `loading="lazy"`. Compress before upload (target < 500 KB via client-side canvas resize).

```tsx
// CORRECT: SVG inline, no decorative animation
<svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 16 16">...</svg>

// WRONG: animated decorative element
<div className="animate-spin text-gray-400">✦</div>
```

---

## 2. Async-Only Data Fetching with Cache

- **Fetch only what is needed**: Never load all projects / all agents on mount. Paginate or lazy-load.
- **Cache aggressively**: Use `SWR` or `React Query` with `staleTime` ≥ 30s for non-volatile data.
- **No waterfall fetches**: Parallel `Promise.all` for independent requests. Never sequential awaits on independent resources.
- **Offline-first for read-only data**: Cache project list, agent configs, and user settings to `localStorage` for instant re-render on app launch.

```ts
// CORRECT: parallel fetch
const [projects, agents] = await Promise.all([
  fetchProjects(userId),
  fetchAgents(userId),
]);

// WRONG: waterfall
const projects = await fetchProjects(userId);
const agents = await fetchAgents(userId); // waits unnecessarily
```

---

## 3. Skeleton UI + Prefetching

- **Skeleton on every async boundary**: Every list, card, or panel that loads async data must show a skeleton placeholder — never a spinner alone.
- **Skeleton dimensions must match real content**: Use fixed-height placeholders that match the expected rendered height. No layout shift.
- **Prefetch on hover/focus**: Use `router.prefetch()` for navigation links. Prefetch project detail data when the user hovers a project card.
- **Agent responses**: Stream tokens as they arrive — never wait for full completion before rendering.

```tsx
// CORRECT: skeleton while loading
{isLoading ? <ProjectCardSkeleton count={3} /> : <ProjectList data={projects} />}

// WRONG: empty state or spinner that shifts layout
{isLoading ? <Spinner /> : <ProjectList data={projects} />}
```

---

## 4. Minimize Data Transfer and DOM Manipulation

- **Response payload size**: API responses must return only required fields. No `SELECT *`. Use response DTOs.
- **Pagination default**: Maximum 20 items per page for any list endpoint. No unbounded queries.
- **DOM node count**: Keep total DOM nodes below 1,500 on any single screen. Virtualize lists > 50 items (use `react-virtual` or similar).
- **No non-essential libraries**: Before adding any npm package, check:
  1. Can this be done with 10 lines of native code?
  2. Is the package < 10 KB gzipped?
  3. Is it tree-shakeable?
  If all three are NO → don't add it.
- **Bundle splitting**: Every route-level page must be dynamically imported. No single bundle > 200 KB gzipped.

```ts
// CORRECT: dynamic import for heavy page
const CanvasPage = dynamic(() => import('./CanvasPage'), { ssr: false });

// WRONG: static import of heavy component at layout level
import CanvasPage from './CanvasPage';
```

---

## 5. Async Core — Instant Interactions

- **User interactions must respond in < 100ms**: Any button press, tap, or gesture must give immediate visual feedback (state change, ripple, opacity) before async work starts.
- **Optimistic UI**: For create/update/delete operations, update the local state immediately and rollback on error. Never block UI on API response.
- **Web Workers for CPU-heavy work**: Canvas rendering, data parsing, export generation — all run in a Web Worker, never on the main thread.
- **Event loop never blocked**: No synchronous loops over large datasets on the main thread. Use chunked processing with `setTimeout(fn, 0)` or `scheduler.postTask`.

```ts
// CORRECT: optimistic update
setProjects(prev => [newProject, ...prev]); // immediate
try {
  await api.createProject(newProject);
} catch {
  setProjects(prev => prev.filter(p => p.id !== newProject.id)); // rollback
}

// WRONG: wait for API before showing result
const created = await api.createProject(payload);
setProjects(prev => [created, ...prev]);
```

---

## Plugin Performance Contract

All plugins must comply with the same performance guidelines:

| Constraint | Limit |
|---|---|
| Plugin bundle size | ≤ 50 KB gzipped |
| Plugin boot time | ≤ 200ms from activate() call |
| DOM nodes added | ≤ 200 per plugin |
| API calls on init | 0 (init must be synchronous) |
| `setInterval` usage | Forbidden |

Plugins that violate these constraints will be rejected from the official plugin registry.

---

## APK-Specific Guidelines

Because IDEAGO is packaged as an Android APK via Capacitor:

- **No `localStorage` size abuse**: Android WebView limits localStorage to 5 MB. Use `@capacitor/preferences` for structured data and `@capacitor/filesystem` for large blobs.
- **Network-aware fetching**: Check `navigator.onLine` before all API calls. Show offline banner if disconnected — never silent failure.
- **Touch targets**: All interactive elements must be ≥ 44×44 dp. No hover-only interactions.
- **Safe area insets**: Use `env(safe-area-inset-*)` for all edge-adjacent UI to support notched Android devices.
- **Back button handling**: All modal/drawer states must be closeable via Android hardware back button (use Capacitor App plugin).

---

*Last updated: 2026-03-19 | Applies to: frontend/, plugins/*
