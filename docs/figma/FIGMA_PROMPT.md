# Figma Prompt
[Figma Prompt - English]

Project Name
IDEAGO (MultiGenius)

Project Type
A tablet-first, mobile-compatible visual ideation web app with customizable AI agents, sketch canvas, optional detail preview, image upload markup, and structured export workflow.

Core Concept
IDEAGO is not a simple drawing app and not a coding app builder. It is a universal creative platform where users can sketch, write, upload references, think visually, and collaborate with customizable AI agents to gradually turn rough ideas into structured, transferable project outcomes.

Core Value

Freeform visual thinking

Customizable multi-agent collaboration

Built-in visualization support

Structured project export for handoff to developers, designers, contractors, or other professionals

Target Devices

Tablet landscape (primary)

Tablet portrait

Mobile portrait (9:16 compatible)

Responsive layout required

No overlapping UI in any device state

Brand Header
Top identity block must always be visible in project-related screens.

Header structure:

Main title: IDEAGO

Small side label: (MultiGenius)

English subtitle: Empowering your ideas with multi-genius collaboration

Korean subtitle: 다중 지능 협업으로 사용자의 아이디어를 구체화하고 발전시키는 시각적 창조 플랫폼

Design Direction

Clean

Minimal

Professional

Tablet productivity focused

White / light gray / black / muted grayscale

Avoid overly colorful UI

Canvas must remain visually dominant

Agent panel should feel supportive, not noisy

Main User Flow

Landing page

Create new project

Set project title or allow auto-title

Select number of AI agents

Assign custom role text for each agent

Enter main canvas workspace

Draw / write / upload image / annotate

Ask questions to agents

Receive summarized guidance

Optionally open Detail View

Export project as structured folder package

Required Screens

Screen 1. Landing / Home

Elements:

IDEAGO logo/title

(MultiGenius) small label

English subtitle

Korean subtitle

New Project button

Open Existing Project button

Recent projects list (optional)

Clean minimal hero layout

Screen 2. New Project Setup

Elements:

Project title input

Auto-generate title option

Agent count selector

Add agent button

Agent role input fields

Start project button

Light onboarding hint:
“You can start rough. Agents will help organize your idea.”

Screen 3. Main Canvas Workspace

Required layout for tablet landscape:

Large canvas area

Tool panel

Agent result/chat panel

Top project header

Upload button

Detail View button

Export button

Canvas tool requirements:

Pen

Brush variants

Eraser

Select

Move

Copy

Cut

Text

Shape

Color options

Zoom controls

Screen 4. Agent Panel

Must support:

User text input

Summarized AI responses

Agent-by-agent role labels

Minimal output by default

Expandable “See More” option for deeper reasoning

Ability to keep panel collapsed or expanded depending on device

Screen 5. Upload + Markup State

Visual behavior:

Uploaded image placed into canvas

User can draw directly on top of image

Notes, arrows, highlights, shapes on top

Must feel similar to note-taking / markup workflow, but more professional

Screen 6. Detail View

This is optional and not always visible.
It opens only when requested.

Possible labels:

Detail View

Visual Preview

3D Preview

Result Preview

Recommended primary label:

Detail View

Purpose:

Show cleaner visual interpretation of rough sketch

Support comparison mode if possible

Allow close inspection of refined result

Can be image-based or advanced preview-based

Screen 7. Project Summary / History

Elements:

Project title

Date created / updated

Agent configuration summary

Key idea summary

User notes

Current purpose status

Next recommended steps

Screen 8. Export Screen

Elements:

Export summary

Included files preview

ZIP export button

Export explanation:
This export package should be easy to hand off to developers, designers, clients, or contractors.

Included file concepts:

project-summary.md

agents.md

canvas-data.json

uploads/

visualization/

instructions.md

export-manifest.json

Responsive Rules

Tablet Landscape

Split screen layout

Canvas dominant

Agent panel visible by default

Tablet Portrait

Vertical stacking allowed

Canvas on top

Agent panel below or collapsible

Mobile Portrait

Tab-based layout required

Tabs:

Canvas

Tools

Agents

Detail View

Export

No cramped multi-panel layout on mobile

Interaction Philosophy

Users may not know what they are making at first

Do not force complex forms at the beginning

Let the system feel permissive and flexible

AI agents should guide gradually, not interrogate aggressively

Rough input must still feel valid

Important Product Principles

The core visualization logic belongs to the platform itself, not only to AI agents

AI agents are assistants for meaning, expansion, and guidance

Users should be able to create without agents, but agents should improve outcomes

Export must preserve the project’s thinking process in a structured, understandable way