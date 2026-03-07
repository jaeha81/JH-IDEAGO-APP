# Figma Prompt
You are designing the backend architecture and implementation plan for a web app called IDEAGO (MultiGenius).

Important constraints:
- Do not remove or simplify core product ideas unless they are technically impossible.
- Preserve the flexible, multi-purpose nature of the product.
- Do not treat this as a simple drawing app or a code generator.
- This is a universal visual ideation platform where users can sketch, write, upload images, annotate, collaborate with customizable AI agents, optionally open a Detail View, and export the project as a structured folder package.

Current workflow status:
- Frontend screen planning and Figma-based UI work have already been completed separately.
- Your task is backend/system planning first.
- Do not start by generating large code files.
- First produce architecture documents and implementation specs only.

You must first read and use these local project documents as source context:
1. docs/product/IDEAGO_MASTER_PLAN.md
2. docs/product/IDEAGO_KEY_FEATURE_SUMMARY.md
3. docs/product/IDEAGO_FEATURE_MAP.md
4. docs/product/IDEAGO_BACKEND_START_CONDITION.md
5. docs/figma/FIGMA_PROMPT.md
6. docs/figma/SCREEN_LIST.md

Core product requirements that must be preserved:
1. Users can start a new project without knowing exactly what they want to make.
2. Users can create a project title manually, or the system can auto-generate one.
3. Users can choose how many AI agents to include in a project.
4. Each agent must support a custom role label defined by the user.
5. The canvas must support freeform sketching, writing, shapes, colors, selection, copy, cut, move, and image overlay/markup.
6. Uploaded images must be annotatable directly on the canvas.
7. AI agents should support summarized guidance by default, not full noisy real-time debate.
8. Detail View is optional and should not be forced as a permanently open panel.
9. The platform itself must support visualization logic as a core feature, not only via AI agents.
10. Every meaningful user action should become structured machine-readable data internally.
11. Export must generate a structured folder/ZIP package that preserves context for developers, designers, contractors, or collaborators.
12. Export contents should include project summary, agent roles, canvas data, uploads, visualization outputs, history, and instructions.

Additional coordination constraints:
- The Figma work is completed enough to serve as current UI reference, but backend architecture must not depend on exact visual panel placement.
- Do not mirror the Figma screen or folder structure directly into backend module structure.
- Organize backend planning around feature responsibilities, data contracts, persistence rules, and export logic.
- Explicitly separate:
  1. fixed product responsibilities
  2. changeable UI/layout decisions
- Treat UI layout details as adjustable, but treat product capabilities and data responsibilities as fixed.
- Do not generate implementation code yet.
- Produce planning documents that remain valid even if minor Figma layout revisions happen later.

Your job now:
Create planning documents only. Do not implement full production code yet.

Assume a pragmatic production-oriented stack unless there is a very strong reason otherwise.
Prefer:
- FastAPI backend
- PostgreSQL database
- file/object storage abstraction for uploads and generated assets
- clean modular architecture
- API-first design
- future support for multi-user collaboration
- privacy-aware handling of uploaded assets

Required output:
Create the following documents in Markdown and save them under docs/backend-planning/ :

1. system-architecture.md
- overall backend architecture
- major services/modules
- separation of concerns
- how AI orchestration is separated from core canvas/project logic
- what is fixed vs what is UI-changeable

2. database-schema.md
- tables/entities
- relationships
- key fields
- versioning/snapshot strategy
- audit/event log strategy
- how machine-readable user actions are stored

3. api-contracts.md
- REST API endpoints
- request/response shape
- MVP vs later endpoints
- upload/export endpoints
- agent interaction endpoints
- note which contracts are UI-agnostic

4. export-structure.md
- folder structure for exported project packages
- required files
- JSON/Markdown responsibilities
- how context is preserved for downstream handoff
- how export differs from simple file download

5. ai-orchestration-strategy.md
- agent flow
- summary-first response model
- token optimization
- recent-event strategy
- compressed project memory design
- when clarification prompts should be triggered
- how to avoid noisy full real-time multi-agent debate

6. risk-register.md
- technical risks
- product-architecture conflicts
- token/cost risks
- mobile/tablet compatibility implications on backend contracts
- privacy/security risks
- mitigation plan

7. mvp-scope.md
- define MVP features
- define features explicitly deferred to later phases
- explain why
- identify what should not be built yet

Important:
- Be concrete.
- Avoid vague product language.
- Preserve the original philosophy.
- Where tradeoffs exist, explain them clearly.
- If something is risky, say so directly.
- Do not silently downgrade core features like image markup, structured export, customizable agent roles, or optional Detail View.
- Do not start scaffolding production code in this step.