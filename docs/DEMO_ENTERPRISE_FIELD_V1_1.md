# Demo Enterprise Field V1.1 Script

## Target Audience

- Project Management Office (PMO)
- Project Directors
- Resident Engineers (Residentes de Obra)

## Storyline & Flow (15 Minutes)

### 1. Introduction & The "Why" (2 mins)

**Speaker Hook:** "Construction teams lose 30% of their time reconciling field data and WhatsApp photos with the master schedule. We've built the Field Module to eliminate that gap instantly."

- **Focus:** Show the **SALI/MAWI-like** clean aesthetic. Premium, native feel on the browser.
- **Visual:** Open the `FieldDashboard`. Show the loading skeletons turning into a crisp, responsive dashboard.

### 2. The Residente Experience - Frictionless Data Entry (5 mins)

**Scenario:** A Residente needs to report progress and flag an issue offline.

- **Action:** Open _FieldDashboard_ -> Click an Activity -> Open `FieldEntryDetail`.
- **Highlight:**
  - Show the gradient-filled "Avance" (Progress) Slider. It feels premium and precise.
  - Show the "Evidencia" (Evidence) Box - dropping photos with a sleek UI.
  - **The Killer Feature:** Toggle device offline (simulate no network). Open `IssueTracker`, create a blocking issue. Show how the UI gracefully handles it with a "Guardado en cola offline" (Offline Sync Queue) toast, without disrupting the flow.

### 3. The PMO Experience - Instant Transparency (4 mins)

**Scenario:** The PMO reviews the daily log.

- **Action:** Visit `FieldDashboard` (Online).
- **Highlight:**
  - Show the aggregate view of activities.
  - Open `IssueTracker`. The layout is structured, badges for severity are clear. No cluttered tables, just actionable insights.

### 4. Technical Stability & The Future (3 mins)

**Highlight:**

- Zero compile/linting warnings across the Field module. The foundation is enterprise-grade.
- Mention the migration to `FieldRecords` (V1.1 Multi-tenant model), ensuring the platform can scale to thousands of projects without database fragmentation.

### 5. Call to Action & Q&A (1 min)

- Invite stakeholders to test the flow on their own mobile devices.

---

## Before vs. After Impact

| Aspect               | Before (V1)                               | After (Demo V1.1)                             |
| -------------------- | ----------------------------------------- | --------------------------------------------- |
| **UX Feel**          | Standard Bootstrapped UI                  | Premium, SALI/MAWI Enterprise Aesthetic       |
| **Offline Handling** | Unpredictable, intrusive `alert()` popups | Silent Sync Queues, sleek `sonner` toasts     |
| **Code Stability**   | High TS/Lint debt                         | 0-Critical-Warnings in Core Field Modules     |
| **Performance**      | Janky page loads                          | Smooth skeleton loaders and state transitions |
