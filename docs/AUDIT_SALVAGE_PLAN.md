# Field Management - Audit & Salvage Plan

## Executive Summary

This document provides a technical audit of the Field Management module, classifying its components to make an informed decision on whether to reuse, refactor, or rebuild. The module currently shows signs of duplicated concepts and architectural fragmentation.

## 1. Technical Inventory

### Backend

**Models & Database Schema:**

- `FieldUpdate`, `FieldUpdateItem`, `ActivityWeeklyProgress` (Progress tracking)
- `FieldDailyReport`, `FieldDailyEntry` (Daily logs)
- `Issue` (Punch list items, type='PUNCH_LIST')

**API Modules & Endpoints:**

- `field-updates`: Handles saving project activity progress from the field (`POST /field-updates/draft`, `GET /field-updates/today`)
- `field-reports`: Generates PDF reports, fetches daily logs (`GET /field/reports/today`, `POST /field/reports/entries`)
- `daily-log`: Legacy or alternate implementation?
- `issues`: Handles Punch List Pro logic based on `enablePunchListPro` flag
- `progress-estimates`: Further fragmentation around progress?
- `inspections`, `photos`: Media and QA forms

### Frontend

**Pages (`apps/web/src/pages/field/`):**

- Activity Update Flow: `FieldToday.tsx`, `FieldDashboard.tsx`, `ActivityUpdate.tsx`, `FieldEntryDetail.tsx`
- Dashboard and Metrics: `FieldPMDashboard.tsx`, `DailyLogView.tsx`, `FieldDailySummary.tsx`
- QA / Punch List: `GeneralPunchList.tsx`, `PunchListPro.tsx`, `IssueTracker.tsx`
- Offline Sync: `SyncManagerPage.tsx`

**Offline Capabilities:**

- Powered by `OfflineManager` and IndexedDB.
- `useBackgroundSync` hook to automatically retry pending requests.

## 2. Technical Debt & Hidden Dependencies

1. **Concept Duplication (Reports vs Updates):**
   - `field-updates` tracks task-level progress (`FieldUpdateItem`).
   - `field-reports` tracks daily logs and issues (`FieldDailyEntry`).
   - The boundaries between a "Daily Update" and a "Daily Report" are blurred.
2. **Missing Frontend Implementations:**
   - Frontend pages use `api.post('/field-updates/draft')` but do not seem to call the submit (`/submit`) endpoints, suggesting draft-only persistence in the current UI flow.
3. **Database Schema Redundancy:**
   - Tracking progress in `ActivityWeeklyProgress`, `ProgressEstimate`, and `FieldUpdateItem`. This requires a heavy reconciliation layer.

## 3. Component Classification

See `COMPONENT_CLASSIFICATION.csv` for details.

## 4. Vertical Slice Test

(To be executed: Test the `ActivityUpdate.tsx` -> `POST /field-updates/draft` flow).
