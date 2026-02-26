# Legacy Data Model Retirement Plan (Phase 1)

**Date:** Week 3
**Module:** Field (V1 vs V1.1)

## Context

With the introduction of the multi-tenant, polymorphic `FieldRecord` model, the legacy models (`FieldDailyUpdate`, `FieldIssue`, `MaterialRequest`) are slated for gradual retirement to reduce technical debt, prevent data fragmentation, and simplify the API layer.

Phase 1 focuses on halting the creation of new legacy records and switching read operations to the new polymorphic model for specific high-stability features.

## Slated for Phase 1 Retirement (Next Week)

- **Table:** `FieldDailyUpdate`
  - **Reason:** `FieldRecord` handles daily updates natively with `type="DAILY_ENTRY_LOG"`.
  - **Risk Level:** Medium. Requires ensuring all history views and dashboard metrics map directly to the polymorphic schema.
- **Table:** `FieldIssue`
  - **Reason:** The `IssueTracker` component can fully rely on `type="ISSUE"` within `FieldRecord`.
  - **Risk Level:** Low. Front-end is already largely decoupled.

## Prerequisites for Phase 1 Data Drop

Before executing `DROP TABLE` or `Prisma.FieldDailyUpdate` removal:

1. **Migration Verification**: A script must assert that `SELECT COUNT(*) FROM FieldDailyUpdate` matches the exact number of migrated `FieldRecord` rows with `type="DAILY_ENTRY"`.
2. **Zero-Divergence Period**: The backend feature flag `isFieldRecordsV1Enabled` must be globally forced `true` for 48 hours in Staging without fallback.
3. **Frontend Deprecation Check**: Remove any hardcoded `/api/field-updates` usage across the frontend codebase. (Checked: only legacy components and fallback blocks still reference this).

## Execution Strategy

1. Next week, toggle `isFieldRecordsV1Enabled` globally to `true` on the frontend side.
2. Monitor Sentry logs for 404s/500s on the new `FieldRecord` API endpoints.
3. Once stable, submit a PR removing `FieldDailyUpdate` schema definitions and running Prisma Migrations.
