# IDEAGO Frontend

Next.js 14 + TypeScript frontend for IDEAGO (MultiGenius).

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Structure

```
app/              # Next.js App Router pages and layouts
components/       # Reusable UI components (empty — implementation Step 9)
lib/
  api.ts          # Typed fetch wrapper — points to backend API
types/
  index.ts        # Core domain types aligned with API contracts
public/           # Static assets
```

## Key Principles (from IDEAGO_FEATURE_MAP.md)

- Canvas area is visually dominant — agent panel is supportive, not noisy
- Detail View is on-demand only — never auto-open
- Upload + Markup is a core feature, not optional
- Export is a structured handoff package, not a file download
- Responsive: tablet landscape (primary), tablet portrait, mobile portrait

## Environment Variables

See `.env.example`. The only required variable for local dev is `NEXT_PUBLIC_API_URL`.
