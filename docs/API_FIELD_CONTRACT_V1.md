# API Field Contract V1 (Unified Field Module)

## 1. Inventory & Consolidation Analysis

### Current Fragmented Modules

- `field-updates`: Handles offline drafts (`/draft`), today stats (`/today`), submit (`/:id/submit`). _Already marked as deprecated._
- `field-reports`: Manages daily aggregations (`/today`, `/sync-draft`, `/entries`, `/:id/submit`, `/:id/pdf`).
- `daily-log`: Fetching daily reports and PDFs (`/:date`, `/:date/pdf`). Heavily overlaps with `field-reports`.
- `photos`: Uploads media (`/upload`).
- `inspections`: CRUD for Inspections.
- `issues`: CRUD for Punch list / Issues.
- `material-requests`: CRUD for Material Requests.
- `rfis`: CRUD for RFIs.

### Redundancies & Overlaps

1. **Daily Logs vs Field Reports**: `daily-log` and `field-reports` serve almost identical purposes (viewing the day's activity). `/field/reports/today` vs `/daily-log/:date`.
2. **Offline Draft Synchronization**: Currently offline queues sync via `field-reports/sync-draft` and `field-updates/draft`.
3. **Inconsistent Envelopes**: Some return naked arrays, others return nested objects. Errors are handled inconsistently.

---

## 2. Unified Contract Design (`Field Record`)

To solve fragmentation, we introduce the concept of a **Field Record**. A Field Record is a polymorphic entity that represents any field-level action (Issue, Inspection, RFI, Material Request, Daily Log Entry).

### Standard URI Structure

Base path: `/field-records`

- `GET /field-records` (List all records, filter by type)
- `POST /field-records/sync` (Offline synchronization queue)
- `GET /field-records/:id`
- `PATCH /field-records/:id`
- `DELETE /field-records/:id`

_(Note: Resources like Photos will remain under `/photos/upload` as it's a binary upload endpoint, but they will be linked to `Field Record` entities using `evidenceRefs` / `recordId`)_

### Unified Payload Structure

All field records must comply with the following shape:

```typescript
// Envelope Design
interface FieldRecordEnvelope<T> {
  data: FieldRecord<T> | FieldRecord<T>[];
  meta: {
    tenantId: string;
    projectId: string; // Context
    timestamp: string; // ISO 8601
    count?: number; // For arrays
  };
}

// Field Record Polymorphic Type
interface FieldRecord<T> {
  id: string; // UUID
  type: 'ISSUE' | 'INSPECTION' | 'RFI' | 'MATERIAL_REQUEST' | 'DAILY_ENTRY';
  status: string; // Standardized: 'OPEN', 'IN_PROGRESS', 'CLOSED', 'SUBMITTED'
  content: T; // Module specific data
  evidenceRefs: string[]; // UUIDs of uploaded photos/documents
  createdBy: string; // UUID of User
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  geo?: {
    lat: number;
    lng: number;
  };
}
```

### Response Standards

- **Success (200/201)**: Returns `FieldRecordEnvelope` or simple object if adapter.
- **Validation Error (422)**: Standard NestJS Validation Pipe structure.
- **Not Found (404)**: Resource doesn't exist or cross-tenant access attempted.
- **Forbidden (403)**: Valid token, but RBAC project/role permissions denied.

---

## 3. Legacy Deprecation Policy

To prevent breaking the current frontend (OfflineManager, ActivityUpdate), legacy routes will be kept but marked as **deprecated**.

### Deprecation Headers

Any request to a legacy endpoint will return:

- `X-Deprecated: true`
- `X-Replacement-Endpoint: /field-records/...`

### Legacy Endpoint Mapping

| Legacy Endpoint                  | Replacement Endpoint                        | Functional Overlap | Target Removal     |
| :------------------------------- | :------------------------------------------ | :----------------- | :----------------- |
| `POST /field-updates/draft`      | `POST /field-records/sync`                  | Offline Sync       | Next Minor Release |
| `POST /field/reports/sync-draft` | `POST /field-records/sync`                  | Offline Sync       | Next Minor Release |
| `GET /daily-log/:date`           | `GET /field-records?type=DAILY_ENTRY`       | Daily Report       | Next Minor Release |
| `GET /field/reports/today`       | `GET /field-records?type=DAILY_ENTRY`       | Daily Report       | Next Minor Release |
| `GET /issues`                    | `GET /field-records?type=ISSUE`             | Read Punch List    | Next Minor Release |
| `POST /issues`                   | `POST /field-records` (type: ISSUE)         | Create Punch List  | Next Minor Release |
| `* /inspections`                 | `* /field-records` (type: INSPECTION)       | Inspections CRUD   | Next Minor Release |
| `* /material-requests`           | `* /field-records` (type: MATERIAL_REQUEST) | Requests CRUD      | Next Minor Release |
| `* /rfis`                        | `* /field-records` (type: RFI)              | RFI CRUD           | Next Minor Release |

---

## 4. Implementation Strategy (Backend)

1. **Create `DeprecationInterceptor`**: A global (or per-controller) interceptor to automatically inject the `X-Deprecated` and `X-Replacement-Endpoint` headers into the response of marked routes.
2. **Apply Decorator**: Create a `@DeprecatedEndpoint(replacementRoute)` decorator and attach it to all the endpoints listed in the legacy table.
3. _(Optional for this phase but required for v2)_ **Create `FieldRecordsModule`**: A new module that handles the unified `FieldRecord` endpoints, routing creations back to the specific legacy services for now, so business logic isn't duplicated.

## 5. Frontend Compatibility

The Frontend's `OfflineManager` currently syncs requests sequentially without knowing the underlying structure perfectly.
We will NOT rewrite the Frontend API client in this phase.
Instead, the Backend API will handle the routing invisibly over the legacy endpoints, returning the deprecation headers transparently. If the Frontend calls `POST /issues`, the `IssuesController` will process it natively as before.

**Result:** No breaking changes to `usePunchList.ts`, `api.ts`, or any frontend views. 100% backward compatibility.
