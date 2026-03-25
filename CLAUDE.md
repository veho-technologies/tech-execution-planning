# CLAUDE.md — Execution Planning Rules

## What This App Does
Capacity planning tool for engineering teams with Linear integration. Manages quarterly roadmaps, sprint allocations, and project sequencing. Visualizes execution via a Gantt-style roadmap and a sprint-by-sprint execution table.

## Environment
- **All plan data changes go to DEV only**: `https://tech-execution-planning.app.dev.shipveho.com/api/`
- Localhost (`http://localhost:3000`) is only for testing bugs and new features — never for plan data changes
- Linear team: FAC (`91e461b7-ddb5-4da6-8e86-734c63aef221`)
- App team ID: `team-1770308519880`

---

## Execution Plan Adjustment Rules

When asked to move, add, remove, or resequence projects:

### 1. Always Update Both Systems
- **App**: projects, allocations, display order (via dev API)
- **Linear**: project start/target dates, milestones (via MCP tools)

### 2. Read Current State First
Before making any changes, fetch:
- Team settings: `GET /api/teams`
- Quarter settings: `GET /api/team-quarter-settings?team_id={id}&quarter_id={id}`
- Sprints: `GET /api/sprints?quarter_id={id}`
- Projects: `GET /api/projects?quarter_id={id}&team_id={id}`
- Allocations: `GET /api/allocations?project_id={comma-separated-ids}`
- Holidays: `GET /api/holidays?quarter_id={id}`

### 3. Capacity is a HARD CAP
- The app already calculates capacity per sprint — trust the app's numbers, do not reimplement the formula
- To validate: sum `planned_days` for all allocations in a sprint and compare against the sprint's capacity
- **If a change would exceed sprint capacity: REFUSE the change** and show:
  - Current sprint utilization (allocated / capacity)
  - How much capacity remains in that sprint
  - Suggest alternatives: move to next sprint, split across sprints, or swap with a lower-priority project

### 4. Show Before/After
After any change, show a summary table with:
- What moved and where
- Sprint capacity utilization before and after
- Any downstream impacts (projects that shifted)

---

## Planning Model

- **Dev week estimates = engineer-weeks** (include tech spec, development, and UAT)
- **Only rollout (2 days) is additional** — not included in the estimate
- **Calendar time** = planned_days / num_engineers
- **All engineers work on one project at a time** during Dev → UAT → Rollout
- 1 engineer can peel off for tech spec of the next project during current project's dev phase
- Projects are sequenced by priority (`display_order` field)

### Phase Conventions
- Tech Spec: 2d (small) or 4d (large) — included in estimate
- Development: per estimate — included in estimate
- UAT: 3 days — included in estimate
- Rollout: 2 days — ADDITIONAL, on top of estimate

---

## API Reference (Dev Environment)

Base URL: `https://tech-execution-planning.app.dev.shipveho.com/api`

| Endpoint | Method | Purpose |
|---|---|---|
| `/projects?quarter_id={id}&team_id={id}` | GET | List projects |
| `/projects` | POST | Create project (`id`, `linear_issue_id`, `team_id`, `quarter_id`, `planned_weeks`) |
| `/projects/reorder` | POST | Reorder projects (`projectOrders` array with `id` + `displayOrder`) |
| `/projects/{id}` | DELETE | Delete project |
| `/allocations?project_id={ids}` | GET | Get allocations (comma-separated project IDs) |
| `/allocations` | POST | Upsert allocation (`project_id`, `sprint_id`, `planned_days`, `phase`, `num_engineers`, `sprint_goal`) |
| `/sprints?quarter_id={id}` | GET | List sprints for quarter |
| `/sprints` | POST | Create/upsert sprint |
| `/teams` | GET | List teams with engineer counts |
| `/team-quarter-settings?team_id={id}&quarter_id={id}` | GET | Per-quarter overrides |
| `/holidays?quarter_id={id}` | GET | Holidays in quarter |
| `/linear/projects/bulk` | POST | Fetch Linear metadata (`projectIds` array) |

### Project ID Format
`proj-{quarter_id}-{linear_project_id}` (e.g., `proj-q2-2026-d007abf3-...`)

### Allocation Upsert
POST to `/allocations` uses `ON CONFLICT (project_id, sprint_id) DO UPDATE` — safe to call repeatedly.

---

## Linear Integration (via MCP)

When updating the plan, also update Linear to keep dates in sync:
- `save_project` — update `startDate`, `targetDate`
- `save_milestone` — update milestone `targetDate`
- `get_project` — read current Linear project state
- `list_projects` with `team: "FAC"` — list all FAC projects

---

## Change Workflow

When asked to adjust the execution plan:

1. **Fetch** current state from dev API (team, sprints, projects, allocations)
2. **Calculate** current capacity utilization per sprint
3. **Propose** the change — show what will move, capacity impact, and any downstream effects
4. **Wait for user confirmation** before making any changes. Do NOT execute until the user explicitly approves.
5. **Validate** no sprint exceeds capacity (hard cap)
6. **If over capacity** → REFUSE, show utilization table, suggest alternatives
7. **If valid and approved** → execute:
   - Update app via dev API (projects, allocations, display order)
   - Update Linear via MCP (project dates, milestones)
8. **Show** before/after summary with capacity impact
