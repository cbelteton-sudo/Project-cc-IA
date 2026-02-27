# HOTFIX REPORT: Field Command Center Create Flow

**Date**: 2026-02-27
**Issue**: Field Operators and Residents were entirely blocked from creating any action items, observations, or quality checks via the new Field Command Center landing page on both Mobile and Desktop interfaces.

## 1. Problem Diagnosis

The `QuickCreateModal` (Floating Action Button + UI dialog) was capturing user input correctly, but was failing on two systemic levels:

- **Online Scenario (403 Forbidden)**: The unified API endpoint `POST /field-records` was protected by the `@RequirePermissions(Permission.PROJECT_EDIT)` decorator. In the `ROLE_PERMISSIONS` matrix, the `FIELD_OPERATOR` role does not possess project-wide edit permissions. This mismatch caused an immediate 403 Forbidden rejection and stalled all data entry from standard field users.
- **Offline Scenario (Data Black Hole)**: When the user lacked network connectivity, the modal successfully intercepted the payload and saved it to the local Dexie container (`updates` table) under the `FIELD_RECORD_V2` discriminator. However, the existing `OfflineManager.ts` was hardcoded to only synchronize legacy event items from the `offline_queue` table. As a result, new V2 records created offline were permanently stranded in the frontend caching layer with no route to the server.

## 2. Technical Resolutions

### Backend: Reframing RBAC to `TASK_CREATE`

The `field-records.controller.ts` endpoint was modified to utilize the `@RequirePermissions(Permission.TASK_CREATE)` decorator instead of `PROJECT_EDIT`.

_Why?_ The `ROLE_PERMISSIONS` configuration explicitly grants `TASK_CREATE` to the `FIELD_OPERATOR` group. Since Field Records are essentially task-like entities (actions, issues, quality entries), binding them to the `TASK_CREATE` authorization perfectly matches the intended business capability for operators on the floor.

### Frontend: Autonomous Sync Polling

To fix the offline records black hole, a custom synchronization observer was embedded inside `FieldDashboardV2.tsx`.

_Mechanism_:

1. The component utilizes a `useEffect` bounded to `isOnline` and `selectedProjectId`.
2. When the device regains connection, it scans the Dexie database specifically for `FIELD_RECORD_V2` items.
3. For each stranded payload, it unwinds the local-only properties (`id`, `createdAt`), resets the status to `PENDING` ensuring backend acceptance, and directly dispatches them to the `POST /field-records` API.
4. Upon successful receipt, the row is cleared from the local device, a unified success Toast displays mentioning the exact volume of synced items, and the application artificially triggers a `windowFocus` event. This natively forces `@tanstack/react-query` to pull the fresh authoritative data from the server, instantly updating the user interface.

## 3. Evidence of Success

- **Action Validation**: The application logs verify that standard field workers (`operario_1@uat.com`) can hit `POST /field-records` perfectly without 403 blocks.
- **Offline Support**: The Dexie `updates` structure reliably empties itself dynamically and seamlessly populates the backend Prisma models upon simulated reconnection.

**Status**: Resolved and merged. The offline-first design originally pioneered in the legacy daily logs is now modernized completely across the V2 Field Command Center interface.
