# Agent 1: Reconnaissance Report

**Target Module:** Scrum Module
**Target Model:** `BacklogItem`

## 1. Database Schema

- **File:** `prisma/schema.prisma`
- **Model:** `BacklogItem` (Line 900)
- **Current Fields:**
  - `id`, `projectId`, `title`, `description`
  - `status` (String: BACKLOG, READY, IN_SPRINT, DONE, BLOCKED)
  - `priority` (Int: 1-5) -> _Insufficient for Matrix (needs 2 dimensions)_
  - `assigneeUserId` -> Relation to `User`
  - `dueDate`
- **Missing Fields:** `isUrgent`, `isImportant`
- **Recommendation:** Option A (2 Booleans) as per prompt.

## 2. Backend Patterns

- **Path:** `apps/api/src/modules/scrum/`
- **Controller:** `ScrumController` (`scrum.controller.ts`)
  - Prefix: `scrum`
  - Auth: `@UseGuards(JwtAuthGuard)`
  - User Injection: `@ActiveUser()`
- **Service:** `ScrumService` (`scrum.service.ts`)
- **DTOs:** `class-validator` (e.g., `CreateBacklogItemDto`)
- **Endpoints:**
  - `GET /scrum/backlog/:projectId`
  - `PATCH /scrum/backlog/:id`
- **Proposed Endpoints:**
  - `GET /scrum/projects/:projectId/eisenhower`
  - `PATCH /scrum/backlog/:id/eisenhower` (Body: `{ isUrgent, isImportant }`)
  - `GET /scrum/projects/:projectId/eisenhower/stats`

## 3. Frontend Patterns

- **Path:** `apps/web/src/`
- **Tech:** React, Vite, Tailwind CSS, Radix UI, TanStack Query, Axios.
- **Routing:** React Router v6/7 (implied).
- **Drag & Drop:** `@dnd-kit/core` (used in `SprintBoard.tsx`).
- **Icons:** `lucide-react`.
- **Components:** `components/ui/` (Radix wrappers).
- **Pages:** `pages/Projects.tsx`

## 4. Conventions

- **Naming:** CamelCase for vars/funcs, PascalCase for Components/Classes.
- **English/Spanish:** Code in English, UI in Spanish (labels).
- **Imports:** Relative mostly, some aliases possible but relative seen in `SprintBoard`.

**Ready for Agent 2.**
