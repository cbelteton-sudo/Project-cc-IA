# Frontend Field Migration Map (Canonical V1)

This document tracks the incremental migration of Next.js frontend components from legacy duplicate endpoints to the unified `/field-records` canonical endpoint as defined in `API_FIELD_CONTRACT_V1.md`.

## Feature Flag

The migration uses the strict feature flag: `NEXT_PUBLIC_FIELD_RECORDS_V1_FRONTEND=true/false`.

- **ON**: Routes through `fieldRecordsApiClient` directly to `/field-records`.
- **OFF**: Falls back to legacy modular endpoints.

## Endpoint Mapping Matrix

| Legacy Endpoint                  | Canonical Endpoint                             | UI Component / HookAffected | Status   | Notes                               |
| -------------------------------- | ---------------------------------------------- | --------------------------- | -------- | ----------------------------------- |
| `POST /issues`                   | `POST /field-records` (type: ISSUE)            | `IssueTracker`              | COMPLETE | Flag determines endpoint routing.   |
| `GET /issues`                    | `GET /field-records` (type: ISSUE)             | `IssueTracker`              | COMPLETE | Supports offline fallback parsing.  |
| `POST /daily-log`                | `POST /field-records` (type: DAILY_ENTRY)      | `FieldEntryDetail`          | COMPLETE | Mapped via `mapOfflinePayloadToV1`. |
| `GET /daily-log`                 | `GET /field-records` (type: DAILY_ENTRY_LOG)   | `FieldEntryDetail`          | COMPLETE | Fetches full activity history.      |
| `POST /inspections`              | `POST /field-records` (type: INSPECTION)       |                             | PENDING  |                                     |
| `GET /inspections`               | `GET /field-records` (type: INSPECTION)        |                             | PENDING  |                                     |
| `POST /photos`                   | `POST /field-records` (type: PHOTO)            | `OfflineManager`            | PARTIAL  | Appends both legacy and new refs.   |
| `GET /photos`                    | `GET /field-records` (type: PHOTO)             |                             | PENDING  |                                     |
| `POST /material-requests`        | `POST /field-records` (type: MATERIAL_REQUEST) |                             | PENDING  |                                     |
| `GET /material-requests`         | `GET /field-records` (type: MATERIAL_REQUEST)  |                             | PENDING  |                                     |
| `POST /rfis`                     | `POST /field-records` (type: RFI)              |                             | PENDING  |                                     |
| `GET /rfis`                      | `GET /field-records` (type: RFI)               |                             | PENDING  |                                     |
| `POST /field/reports/sync-draft` | `POST /field/reports/sync-draft`               | `OfflineManager`            | COMPLETE | Removed duplicate sync logic.       |

## Progress Tracker

**Total Migrated**: ~60% (Core records migrated)  
**Pending Flows**: 4 / 7 Write paths, 5 / 7 Read paths.  
**Critical Regressions**: None detected yet.
