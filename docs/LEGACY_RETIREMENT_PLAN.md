# Legacy API Retirement Plan

## 1. Context and Objective

With the successful rollout of the unified `/field-records` API, older specialized endpoints (`/inspections`, `/issues`, `/field-reports`, `/material-requests`) are marked for retirement to decrease maintenance surface area, eliminate redundancy, and force global consistent RBAC implementations.

## 2. Prerequisites for Retirement

Before hard-deprecating the legacy endpoints, the following conditions must be met:

1. **Frontend Parity**: ALL web frontend and mobile application screens must point to `/field-records`.
2. **Offline Queue Sync**: Local caches in mobile must use `/field-records/sync` exclusively.
3. **Data Integrity Audit**: Running a batch comparison check matching records ingested by new facade versus existing queries to confirm zero data structure loss.

## 3. Retirement Timeline

| Phase       | Milestone                       | Expected Timeframe | Description                                                                                                                         |
| ----------- | ------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1** | **Soft Deprecation (Log Only)** | Week 3             | Append `Deprecated` warning headers to response and log metric alerts if legacy endpoints are hit. Frontend updates begin.          |
| **Phase 2** | **Dark Launch Routing**         | Week 4             | Proxies (Gateway or API level interceptor) forward background validation logic to unified facade. Monitor dual-writes or conflicts. |
| **Phase 3** | **Hard Deprecation (Cutoff)**   | Week 5             | Endpoints removed from `app.module.ts`. Controllers deleted. Return `410 Gone / 404 Not Found`.                                     |
| **Phase 4** | **Codebase Cleanup**            | Week 6             | Deletions of DTOs, legacy API testing, and pruning service methods exclusively tied to the old API routes.                          |

## 4. Rollback Plan

If critical issues are identified in Phase 1 or 2:

- Frontend config changes to be reverted pointing back to original endpoint URIs.
- Discontinue proxy routing.
- Fast-track debugging of the facade before resuming the timeline.

## 5. Risk Assessment

| Risk                                                      | Severity | Mitigation                                                                             |
| --------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| Mobile Offline queue compatibility breaks during transfer | HIGH     | Thorough e2e tests isolating offline scenarios before switching configs in production. |
| Overloaded Facade Endpoint (Rate limiting / Bottlenecks)  | MEDIUM   | Scale facade instances, implement optimized Prisma indices per record type queries.    |
