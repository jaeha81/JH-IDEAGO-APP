// Mock data: canvas state, agent responses, assets, events.
// All shapes align exactly with backend API contracts.

import type {
  CanvasState,
  AgentResponse,
  AgentQueryResponse,
  AgentFullReasoning,
  UploadedAsset,
  DetailViewResult,
  ProjectEvent,
} from "@/types";

// ─── Canvas ───────────────────────────────────────────────────────────────────

export const MOCK_CANVAS_STATE: CanvasState = {
  version: 1,
  width: 2560,
  height: 1920,
  background: "#FFFFFF",
  elements: [
    {
      id: "elem-001",
      type: "stroke",
      data: {
        points: [[100, 100], [150, 120], [220, 95], [300, 140], [380, 110]],
        color: "#000000",
        width: 2,
        opacity: 1.0,
        tool: "pen",
      },
      z_index: 0,
      position_x: 0,
      position_y: 0,
    },
    {
      id: "elem-002",
      type: "text",
      data: {
        content: "Login Screen — Wireframe v2",
        font_size: 20,
        font_family: "sans-serif",
        color: "#111111",
      },
      z_index: 1,
      position_x: 100,
      position_y: 50,
    },
    {
      id: "elem-003",
      type: "shape",
      data: {
        shape_type: "rect",
        width: 320,
        height: 200,
        fill: "transparent",
        stroke_color: "#888888",
        stroke_width: 1,
      },
      z_index: 2,
      position_x: 400,
      position_y: 200,
    },
    {
      id: "elem-004",
      type: "image_overlay",
      data: {
        asset_id: "asset-001",
        width: 400,
        height: 300,
        rotation: 0,
        annotations: [
          {
            type: "arrow",
            from: [310, 160],
            to: [500, 250],
          },
          {
            type: "note",
            position: [400, 200],
            text: "Consider gesture-based navigation here",
          },
        ],
      },
      z_index: 3,
      position_x: 300,
      position_y: 150,
    },
  ],
};

// ─── Agent Responses ──────────────────────────────────────────────────────────

const MOCK_QUERY_ID = "qry-20260115-001";

export const MOCK_AGENT_QUERY_RESPONSE: AgentQueryResponse = {
  query_id: MOCK_QUERY_ID,
  responses: [
    {
      response_id: "resp-001",
      query_id: MOCK_QUERY_ID,
      agent_id: "agent-001",
      agent_role_label: "Visual Architect",
      user_query: "How should we structure the login flow?",
      summary_text:
        "Consider a 3-step flow: welcome → email/password → biometric option. Use progressive disclosure to avoid overwhelming new users on first launch.",
      has_full_reasoning: true,
      created_at: "2026-01-15T14:20:00Z",
    },
    {
      response_id: "resp-002",
      query_id: MOCK_QUERY_ID,
      agent_id: "agent-002",
      agent_role_label: "UX Critic",
      user_query: "How should we structure the login flow?",
      summary_text:
        "Watch out for common pitfalls: don't ask for optional fields upfront, ensure error messages are specific, and test with users on slow networks where biometrics time out.",
      has_full_reasoning: true,
      created_at: "2026-01-15T14:20:00Z",
    },
    {
      response_id: "resp-003",
      query_id: MOCK_QUERY_ID,
      agent_id: "agent-003",
      agent_role_label: "Creative Catalyst",
      user_query: "How should we structure the login flow?",
      summary_text:
        "What if login wasn't the first thing users saw? Consider a 'try first, sign up later' guest mode — lower friction, higher conversion, especially for first-time users.",
      has_full_reasoning: false,
      created_at: "2026-01-15T14:21:00Z",
    },
  ],
};

export const MOCK_FULL_REASONING: AgentFullReasoning = {
  response_id: "resp-001",
  query_id: MOCK_QUERY_ID,
  agent_id: "agent-001",
  agent_role_label: "Visual Architect",
  summary_text:
    "Consider a 3-step flow: welcome → email/password → biometric option. Use progressive disclosure to avoid overwhelming new users on first launch.",
  full_reasoning: `SUMMARY:
Consider a 3-step flow: welcome → email/password → biometric option. Use progressive disclosure to avoid overwhelming new users on first launch.

FULL REASONING:
Based on the canvas sketch and the current wireframe annotations, the login flow should be restructured with the following rationale:

1. **Welcome screen purpose**: Establish brand identity, not collect data. Users arrive with intent — don't interrupt it with forms immediately.

2. **Progressive disclosure**: Email/password is the universal baseline, but biometric (Face ID, fingerprint) should be offered as an opt-in enhancement on the second launch, not the first. Forcing biometric setup on first login creates cognitive overhead.

3. **Three-step structure**:
   - Step 1: Brand welcome, single CTA ("Get Started")
   - Step 2: Email + password form with "Forgot password" visible immediately
   - Step 3 (post-login): Biometric enrollment prompt with "Maybe later" as primary visual hierarchy

4. **Visual hierarchy considerations**: The canvas shows a rectangle placeholder at (400, 200) — this aligns well with a centered card layout. The stroke annotations suggest the designer is already thinking about generous whitespace.

5. **Accessibility**: Ensure the form uses proper autocomplete attributes (email, current-password) so password managers and OS autofill work without friction.

6. **Error states**: Design these alongside happy paths — error message placement below each field, not as a modal. This is the most common oversight in login redesigns.

Recommendation: Start with the simplest possible login form, then layer biometric opt-in as a separate enhancement sprint.`,
  token_count: 312,
  model_used: "claude-sonnet-4-6",
  created_at: "2026-01-15T14:20:00Z",
};

// Previous query history (for response history panel)
export const MOCK_RESPONSE_HISTORY: AgentResponse[] = [
  ...MOCK_AGENT_QUERY_RESPONSE.responses,
  {
    response_id: "resp-004",
    query_id: "qry-20260115-000",
    agent_id: "agent-001",
    agent_role_label: "Visual Architect",
    user_query: "What are the core screens we need?",
    summary_text:
      "Five screens cover the MVP: splash, login, home feed, detail, and settings. Keep navigation flat — no nested tabs beyond level 2.",
    has_full_reasoning: true,
    created_at: "2026-01-15T13:50:00Z",
  },
  {
    response_id: "resp-005",
    query_id: "qry-20260115-000",
    agent_id: "agent-002",
    agent_role_label: "UX Critic",
    user_query: "What are the core screens we need?",
    summary_text:
      "Agree on 5 screens but push back on 'splash' — splash screens are a dark pattern for returning users. Use it for first-launch onboarding only.",
    has_full_reasoning: true,
    created_at: "2026-01-15T13:50:00Z",
  },
];

// ─── Assets ───────────────────────────────────────────────────────────────────

export const MOCK_ASSETS: UploadedAsset[] = [
  {
    asset_id: "asset-001",
    original_name: "reference-screen.jpg",
    mime_type: "image/jpeg",
    storage_url: "https://placehold.co/400x300/1A1A1A/888888?text=reference-screen.jpg",
    thumbnail_url: "https://placehold.co/120x90/1A1A1A/888888?text=thumb",
    file_size_bytes: 204800,
    uploaded_at: "2026-01-15T14:10:00Z",
  },
  {
    asset_id: "asset-002",
    original_name: "competitor-analysis.png",
    mime_type: "image/png",
    storage_url: "https://placehold.co/600x400/1A1A1A/888888?text=competitor-analysis.png",
    thumbnail_url: "https://placehold.co/120x90/1A1A1A/888888?text=thumb",
    file_size_bytes: 512000,
    uploaded_at: "2026-01-15T11:30:00Z",
  },
];

// ─── Detail View ──────────────────────────────────────────────────────────────

export const MOCK_DETAIL_VIEW_RESULT: DetailViewResult = {
  result_id: "detail-001",
  result_type: "image",
  status: "completed",
  storage_url: "https://placehold.co/800x600/1A1A1A/888888?text=Detail+View+Result",
  user_prompt: "Generate a high-fidelity mockup of the login screen",
  error_message: null,
  created_at: "2026-01-15T14:35:00Z",
  completed_at: "2026-01-15T14:35:30Z",
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const MOCK_EVENTS: ProjectEvent[] = [
  {
    event_id: "evt-001",
    project_id: "proj-001",
    user_id: "user-001",
    event_type: "project.created",
    payload: { title: "Mobile App Redesign" },
    sequence_num: 1,
    created_at: "2026-01-10T09:00:00Z",
  },
  {
    event_id: "evt-002",
    project_id: "proj-001",
    user_id: "user-001",
    event_type: "agent.added",
    payload: { agent_id: "agent-001", role_label: "Visual Architect" },
    sequence_num: 2,
    created_at: "2026-01-10T09:01:00Z",
  },
  {
    event_id: "evt-003",
    project_id: "proj-001",
    user_id: "user-001",
    event_type: "asset.uploaded",
    payload: { asset_id: "asset-001", filename: "reference-screen.jpg" },
    sequence_num: 3,
    created_at: "2026-01-15T14:10:00Z",
  },
  {
    event_id: "evt-004",
    project_id: "proj-001",
    user_id: "user-001",
    event_type: "agent.query.sent",
    payload: { query_id: MOCK_QUERY_ID, user_query: "How should we structure the login flow?" },
    sequence_num: 4,
    created_at: "2026-01-15T14:20:00Z",
  },
  {
    event_id: "evt-005",
    project_id: "proj-001",
    user_id: "user-001",
    event_type: "canvas.snapshot.saved",
    payload: { snapshot_id: "snap-001", trigger: "manual" },
    sequence_num: 5,
    created_at: "2026-01-15T14:30:00Z",
  },
];
