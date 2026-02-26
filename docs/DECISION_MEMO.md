# DECISION MEMO: Field Management Module

## 1. Context & Objective

The Field Management module was evaluated to determine its technical viability for production release. The audit focused on architecture, offline sync flows, DB schema mapping, and security.

## 2. Technical Findings

1. **Security Vulnerability:** The `FieldUpdatesController` is completely missing the `@UseGuards(JwtAuthGuard)` decorator. It is currently exposed without authentication.
2. **Architectural Duality:** There are two diverging data paths to record field progress: `field-updates` (using `FieldUpdateItem`) and `field-reports` (using `FieldDailyEntry`). They solve similar problems but are heavily fragmented.
3. **Frontend Strength:** The frontend utilizes a robust IndexedDB queue (`OfflineManager`) to stash requests (offline support), syncing them back seamlessly via `SyncManagerPage.tsx`.

## 3. Options Considered

- **Build-on-top:** Continue building on the existing dual architecture.
  - _Pros:_ Fastest immediate delivery.
  - _Cons:_ Very high regression risk; disjointed API logic; accumulating technical debt.
- **Rebuild Clean:** Scrap the entire frontend and backend for field management and rebuild from scratch.
  - _Pros:_ Clean slate, technically sound.
  - _Cons:_ Unacceptable delay to MVP delivery. Wastes the well-implemented offline sync frontend logic.
- **Hybrid (Recommended):** Rebuild and unify the Backend schema and services while reusing the existing React/IndexedDB frontend components.
  - _Pros:_ Salvages the most complex UI parts (Offline Sync, Photo Capture) while securing and unifying the backend to prevent long-term debt.

## 4. Final Decision: HYBRID

We will proceed with the **Hybrid approach**. We will retain the robust frontend `OfflineManager` but perform a mandatory refactoring of the backend to unify `FieldUpdates` and `FieldReports` into a single, cohesive `DailyLog` entity. This ensures security holes are plugged and data consistency is maintained.

---

## 5. 2-Week Execution Plan

### **Week 1: Unification & Security (Backend Focus)**

- **Deliverables:**
  - Merge `FieldUpdateItem` and `FieldDailyEntry` concepts into a unified Prisma schema entity (`DailyLogEntry`).
  - Add `@UseGuards(JwtAuthGuard)` to all exposed field endpoints.
  - Refactor `FieldReportsController` to handle the unified endpoints.
  - Deprecate and remove redundant `field-updates` controllers.
- **Acceptance Criteria:**
  - All endpoints are secured.
  - Backend unit and integration tests are passing.
  - No duplicated fields between daily updates and progress.

### **Week 2: Splicing & E2E Validation (Frontend & QA Focus)**

- **Deliverables:**
  - Repoint all existing UI components (`ActivityUpdate.tsx`, `FieldEntryDetail.tsx`) to the unified endpoints.
  - Map the `OfflineManager` payload to the new backend DTOs.
  - End-to-end testing of the Sync Manager offline/online flow.
- **Acceptance Criteria:**
  - Vertical slice flows seamlessly from field creation (offline) to PM dashboard visualization.
- **Risks & Mitigations:**
  - _Risk:_ Sync logic breaks during endpoint migration.
  - _Mitigation:_ Retain the IndexedDB schema exactly as is; only adjust the API client request formatting before dispatching.

## 6. Component Action Summary

| Component Context                 | Action       | Description                                                      |
| :-------------------------------- | :----------- | :--------------------------------------------------------------- |
| **Frontend Sync/Offline Sync**    | **KEEP**     | The `OfflineManager` and IndexedDB queues are technically sound. |
| **Frontend Activity Views**       | **KEEP**     | Replace API calls but keep the UI components untouched.          |
| **Issues / Punch List APIs**      | **KEEP**     | Already sound and functioning correctly.                         |
| **FieldUpdates Controller**       | **DISCARD**  | Unsecured and duplicates logic. To be removed.                   |
| **FieldReports Service**          | **REFACTOR** | Expand to become the definitive unified daily logging service.   |
| **ActivityWeeklyProgress Schema** | **DISCARD**  | Unify progress calculation to derive from `DailyLogEntry`.       |
