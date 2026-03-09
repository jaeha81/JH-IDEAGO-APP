// Mock data: projects list and individual project detail.
// Shapes match backend API contracts exactly — swap for real API calls in lib/services/.

import type { Project, ProjectSummary } from "@/types";

export const MOCK_PROJECTS: ProjectSummary[] = [
  {
    project_id: "proj-001",
    title: "Mobile App Redesign",
    status: "active",
    created_at: "2026-01-10T09:00:00Z",
    updated_at: "2026-01-15T14:30:00Z",
    agent_count: 3,
  },
  {
    project_id: "proj-002",
    title: null, // valid: untitled project
    status: "active",
    created_at: "2026-01-12T10:00:00Z",
    updated_at: "2026-01-12T10:00:00Z",
    agent_count: 2,
  },
  {
    project_id: "proj-003",
    title: "Brand Identity Workshop",
    status: "active",
    created_at: "2026-01-08T08:00:00Z",
    updated_at: "2026-01-13T16:45:00Z",
    agent_count: 4,
  },
  {
    project_id: "proj-004",
    title: "Q1 Product Roadmap",
    status: "archived",
    created_at: "2025-12-01T10:00:00Z",
    updated_at: "2025-12-20T12:00:00Z",
    agent_count: 2,
  },
];

export const MOCK_PROJECT_DETAIL: Project = {
  project_id: "proj-001",
  title: "Mobile App Redesign",
  auto_title: false,
  status: "active",
  purpose_note: "Redesign the onboarding flow for mobile users — focus on reducing drop-off in the first 3 screens.",
  created_at: "2026-01-10T09:00:00Z",
  updated_at: "2026-01-15T14:30:00Z",
  agents: [
    {
      agent_id: "agent-001",
      role_label: "Visual Architect",
      display_order: 1,
      is_active: true,
    },
    {
      agent_id: "agent-002",
      role_label: "UX Critic",
      display_order: 2,
      is_active: true,
    },
    {
      agent_id: "agent-003",
      role_label: "Creative Catalyst",
      display_order: 3,
      is_active: true,
    },
  ],
  canvas_last_saved: "2026-01-15T14:30:00Z",
  export_count: 2,
};

// Suggested role labels shown as placeholder examples in new project setup.
// Not an enum — users can enter any free text.
export const SUGGESTED_AGENT_ROLES: string[] = [
  "Idea Expander",
  "Visual Architect",
  "UX Critic",
  "Technical Reviewer",
  "Narrative Writer",
  "Creative Catalyst",
  "Devil's Advocate",
  "Market Analyst",
];
