# Field Module QA & E2E Validation - Day 3

## Overview

This document outlines the testing protocols established for Day 3 of the Field Management migration. The primary focus is verifying that the `FieldRecordsModule` backend facade interacts seamlessly with the V1 enabled frontend without triggering any data loss or authorization violations.

## 1. Feature Flag Validation

Before executing tests, ensure your local or staging `.env` contains:
`VITE_FIELD_RECORDS_V1_FRONTEND=true`
Verify the backend handles standard requests by confirming the `FieldRecordsModule` is injected directly in `AppModule`.

## 2. E2E Smoke Test: Create -> Sync -> List -> Detail Flow

### Step A: Offline Queue Interception (`Create`)

1. In the browser, navigate to a Project and open the **Field Dashboard**, then select a specific Schedule Activity to report progress.
2. In developer tools, throttle network to **Offline**.
3. Create a Daily Entry (change Status, advance Progress, add Note, add Photo).
4. Save the entry. Verify the UI confirms it was queued locally (Draft mode).

### Step B: Sync Propagation (`Sync`)

1. Disable Offline throttling.
2. Wait 3 seconds or trigger a manual sync in the frontend UI.
3. Observe Network tab. Assert that a `POST /field-records/sync` network request is made instead of `/field/reports/sync-draft` or `/field-updates/draft`.
4. The request should return a 201 Created and map to the underlying Prisma `FieldDailyEntry` table correctly.

### Step C: Canonical Read (`List` & `Detail`)

1. Navigate to **Issue Tracker**.
2. Verify Network tab. Assert that `GET /field-records?projectId=...&type=ISSUE` is fired and parses correctly.
3. Open a **Field Entry Detail** view.
4. Verify Network tab. Assert `GET /field-records?projectId=...&type=DAILY_ENTRY_LOG&activityId=...` is fired.
5. Confirm the history log correctly renders authors, timestamps, photos, and notes.

## 3. Premium Visual QA

Perform UI checks on the following views:

- **FieldDashboard**: Ensure the Activity dropdown selects properly and drafts display warning badges.
- **FieldEntryDetail**: Ensure Photo Carousels open smoothly. Verify the history log matches the exact schema mapping (especially author metadata, to make sure it doesn't display "Usuario" incorrectly when there's an active author).
- **IssueTracker**: Confirm the layout gracefully handles variable length titles and empty states since the migration mappings might impact missing properties gracefully.

## 4. RBAC & Isolation Confirmation

- Login with a standard Inspector role to Project A. Validate the `enforceScopeWhere` mechanism restricts them from fetching `/field-records` belonging to Project B. Should return 404 or 403, and strictly never load unauthorized records.
