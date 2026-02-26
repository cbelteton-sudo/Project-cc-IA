# Week 2 Progress Report: Field Module Migration

This document tracks execution progress and metrics for Week 2, which focuses on migrating the Next.js Frontend UI to the canonical `/field-records` API and ensuring alignment of the OfflineManager to structure unified payloads.

## Current Metrics

- **Total Frontend API Calls Migrated:** ~65% (OfflineManager + Issue Create/List + Daily Report Save/List)
- **Feature Flag `VITE_FIELD_RECORDS_V1_FRONTEND`:** Installed & Operational (`true`)
- **OfflineManager Unified Core:** Enabled. Payloads map strictly to canonical `v1` formats via `mapOfflinePayloadToV1`.
- **UI Skin (V1):** Premium enterprise skin applied to `IssueTracker`, `FieldDashboard`, and `FieldEntryDetail`.

## Pending Modules

The following high-traffic flows are yet to be migrated using `fieldRecordsService` for read/list operations:

1. Photo Upload Linking (`POST /photos/upload` -> `evidenceRefs` mapping) - partially supported via legacy mappings in OfflineManager fallback.
2. Inspections & Material Requests.

## Risks & Mitigations

1. **Payload Structure Mismatch:** The frontend components currently render specific schemas for `issues` vs `daily-logs`. The canonical `FieldRecord` puts this inside the `content` property.
   _Mitigation (Completed for Writes):_ Created a mapping function `mapOfflinePayloadToV1` that transforms the frontend legacy shape into the exact canonical shape for writes.
2. **Offline Photo Linking:** `evidenceRefs` vs `fieldUpdateId` linking in photos.
   _Mitigation (Completed):_ Retained backward compatibility in `OfflineManager` by passing both `recordId`, `fieldUpdateId`, and `activityId` to photo uploads during the canonical flow.
