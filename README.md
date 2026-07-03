# EnduranceOps UI

Angular SPA — micro-frontend client for the EnduranceOps race logistics platform.

## Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17+ (Standalone Components, SSR) |
| Styling | Tailwind CSS v3 |
| Reactivity | RxJS · Angular Signals |
| Language | TypeScript 5.x (strict mode) |

## Development server

```bash
ng serve
```

Navigate to `http://localhost:4200/`. Hot reload enabled.

## Build

```bash
ng build
```

Artifacts land in `dist/`. Production build is optimized by default.

## Route Map

| Path | Component | Guard | Strategy |
|---|---|---|---|
| `/` | — | — | Redirects to `/login` |
| `/login` | `LoginComponent` | — | Lazy (`loadComponent`) |
| `/dashboard` | `DashboardComponent` | `authGuard` (via layout) | Lazy, nested under `MainLayoutComponent` |
| `/events` | `EventListComponent` | `authGuard` (via layout) | Lazy, nested under `MainLayoutComponent` |
| `/events/new` | `EventCreateComponent` | `authGuard` (via layout) | Lazy, nested under `MainLayoutComponent` |
| `/logistics` | `LogisticsEventListComponent` | `authGuard` (via layout) | Lazy, nested under `MainLayoutComponent` |
| `/logistics/:eventId` | `EventLogisticsComponent` | `authGuard` (via layout) | Lazy, nested under `MainLayoutComponent` |

### Nested Route Architecture

Authenticated routes are nested under `MainLayoutComponent`, which acts as the protected shell. The `authGuard` is applied once at the layout level — any route added under `children` is automatically protected.

```
AppRoutes
├── /login              → LoginComponent                (public, SSR Prerender)
└── ''  [authGuard]     → MainLayoutComponent           (protected shell, SSR Client)
        ├── /dashboard      → DashboardComponent
        ├── /events         → EventListComponent        (Smart) → EventTableComponent (Presentational)
        ├── /events/new     → EventCreateComponent
        ├── /logistics      → LogisticsEventListComponent
        └── /logistics/:id  → EventLogisticsComponent   → CorralCardComponent (Presentational)
```

### SSR Render Modes (`app.routes.server.ts`)

| Route | `RenderMode` | Reason |
|---|---|---|
| `/login` | `Prerender` | Public static page — safe to render at build time |
| `**` | `Client` | All authenticated/dynamic routes — must resolve in browser after hydration |

---

## Feature: Event Create Form (`src/app/features/events/pages/event-create/`)

Multipart form that submits a new race catalog entry to `POST /api/v1/catalog/events`.

### Architecture

`EventCreateComponent` is a single Smart component (no Presentational split — this is a form, not a data list). It owns:

- **`ReactiveFormsModule`** with strict typing via `FormBuilder`.
- **`FormArray` for Offerings** — dynamic rows (add / remove). Each row holds `distance` (enum select), `modality` (enum select), `teamSize` (number), and two CUSTOM-only fields (`customDistanceName`, `distanceInMeters`).
- **`FormArray` for Tiers** — single pre-populated row (`Early Bird`).
- **`futureDateValidator`** — custom `ValidatorFn` that rejects past dates; appends `T00:00:00` before parsing to neutralize UTC timezone shift.

### API contract (`EventService.createCatalogEntry`)

Sends `multipart/form-data` with two parts:

| Part | Content-Type | Value |
|---|---|---|
| `document` | `application/pdf` | File selected by the user |
| `data` | `application/json` | JSON body (see below) |

`Content-Type` is **never set manually** — the browser must append the multipart boundary automatically. `documentVersion` is injected as `'1.0'` inside the service via an immutable spread before `JSON.stringify`.

### Offerings — enum values

| Field | Type | Values |
|---|---|---|
| `distance` | `DistanceCategory` | `FIVE_K` · `TEN_K` · `HALF_MARATHON` · `MARATHON` · `ULTRA` · `CUSTOM` |
| `modality` | `OfferingModality` | `INDIVIDUAL` · `RELAY` |
| `teamSize` | `number` | min 1 |
| `customDistanceName` | `string` | required only when `distance === 'CUSTOM'` |
| `distanceInMeters` | `number \| null` | required, min(1) only when `distance === 'CUSTOM'` |

### Form fields

| Field | Validators |
|---|---|
| `name` | required, minLength(5) |
| `description` | required |
| `raceDate` | required, futureDateValidator |
| `city` | required |
| `issuingAuthority` | required |
| `convocatoriaPublicationDate` | required |
| `offerings[].distance` | required |
| `offerings[].modality` | required |
| `offerings[].teamSize` | required, min(1) |
| `offerings[].customDistanceName` | required (only when distance = CUSTOM) |
| `offerings[].distanceInMeters` | required, min(1) (only when distance = CUSTOM) |
| `tiers[].name/startDate/endDate` | required |
| `tiers[].price` | required, min(0) |

### UX decisions

- File upload uses a `<button>` + `#fileInput` template reference with `class="hidden"` — avoids the `sr-only` scroll-jump bug.
- Global scroll fix: `html, body { height: 100%; overflow: hidden }` + `app-root { display: block; height: 100% }` in `styles.css` ensures `<main>` is the sole scroll surface.
- Layout shell uses `h-full` instead of `h-screen` — stable against OS dialog viewport changes.
- Submit button is `disabled` until `form.valid && selectedFile`.
- Conditional validators applied via `distance.valueChanges` + `takeUntilDestroyed(destroyRef)`.

### Testing (`event-create.component.spec.ts`)

| Test group | Cases |
|---|---|
| `futureDateValidator` | empty, today, future, past |
| Enum constants | `DISTANCE_CATEGORIES` (5 values), `OFFERING_MODALITIES` (2 values) |
| FormArray init | offerings defaults, tiers defaults |
| `addOffering` / `removeOffering` | append, remove by index, guard last row |
| Name validators | required, minLength |
| `raceDate` validators | required, pastDate, future |
| `onFileSelected` | sets file, clears error, sets error on empty |
| `onSubmit` guards | invalid form, valid form but no file |
| HTTP happy path | POST, no manual Content-Type, FormData body, navigate to `/events` |
| HTTP error | sets `submitError` signal |
| `isLoading` lifecycle | true during request, false after flush |
| DOM: submit button | disabled (invalid), disabled (no file), enabled (valid + file) |

---

## Feature: Application Shell (`src/app/core/layout/main-layout/`)

Full-viewport dashboard layout (`h-full overflow-hidden flex`) with three zones:

**Sidebar** (`w-64 bg-slate-900`)
- EnduranceOps wordmark logo.
- Navigation links driven by a `NavItem[]` array — adding a new route is a one-line change.
- Active link highlighted via `routerLinkActive` + `aria-current="page"`.
- Current nav items: Dashboard, Eventos, Logística, Atletas.

**Topbar** (`bg-slate-800 h-16`)
- User badge with operator initials.
- Logout button — delegates to `authService.logout()`.

**Content area** (`flex-1 overflow-y-auto p-6 bg-slate-950`)
- Houses `<router-outlet>` for all child routes.

---

## Feature: Events (`src/app/features/events/`)

Implements the Smart / Presentational pattern for event browsing and status management.

### Architecture

| Component | Role | Responsibilities |
|---|---|---|
| `EventListComponent` | Smart / Container | Injects `EventService`, owns `currentPage` + `searchTerm` + `isLoading` + `eventsPage` signals, dispatches HTTP via `Subject` + `switchMap`, handles optimistic publish |
| `EventTableComponent` | Presentational / Dumb | Renders table, search bar, pagination, Actions column; emits `pageChange`, `searchChange`, `publishEvent`; zero service dependencies |

### Reactivity pattern

- `eventsPage` is a writable `signal<EventsPage>` (not `toSignal`) — required to support in-place optimistic mutations without a refetch.
- `switchMap` on `params$$` cancels in-flight requests on rapid page/search changes.

### Publish flow — optimistic update

`onPublishEvent(eventId)` calls `EventService.publishEvent()` (`PATCH .../status`). On `next`, calls `eventsPage.update()` to map the matching event to `status: 'PUBLISHED'` in-place.

### `EventService` (`src/app/core/services/event.service.ts`)

- `getEvents(page, limit, search?)` — handles both `SpringPage<T>` and plain `T[]` responses.
- `publishEvent(eventId)` — `PATCH /api/v1/catalog/events/{id}/status`.
- `createCatalogEntry(file, data)` — multipart POST.

---

## Feature: Logistics (`src/app/features/logistics/`)

Lifecycle management and corral capacity dashboard. Consumes `LogisticsService` backed by two endpoints.

### Architecture

| Component | Role | Responsibilities |
|---|---|---|
| `LogisticsEventListComponent` | Smart | Injects `LogisticsService`, owns `state` signal (`loading \| loaded \| error`), renders event rows with lifecycle badges |
| `EventLogisticsComponent` | Smart | Reads `:eventId` from `paramMap`, cancels stale requests with `switchMap`, owns `state` signal, delegates card rendering |
| `CorralCardComponent` | Presentational | Receives `CorralDetail` via `input.required<CorralDetail>()`, derives all display values via `computed()` — no service deps |

### State pattern — discriminated union + `@let`

Both Smart components use a `PageState` discriminated union:

```typescript
type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: T }
  | { status: 'error'; message: string };
```

Templates capture the signal snapshot once with `@let s = state()`, enabling TypeScript control-flow narrowing inside `@if (s.status === 'loaded')` blocks. Without `@let`, each `state()` call is a fresh invocation that the Angular compiler treats as the full union type.

### Logistics Event List (`/logistics`)

- Lists all events in the logistics lifecycle with their current status badge.
- `STATUS_META: Record<LogisticsEventStatus, StatusMeta>` maps each of the 6 backend enum values to `{ label, classes, pulse }`.
- `ALLOCATION_IN_PROGRESS` triggers an `animate-pulse` indicator dot.
- Each row is a `<a [routerLink]>` navigating to `/logistics/:eventId`.
- `openCorral: true` events show an orange "Open Corral" badge.

### Logistics Status Badges

| Status | Color | Pulse |
|---|---|---|
| `CONFIGURATION_PHASE` | Blue | No |
| `READY_FOR_ALLOCATION` | Cyan | No |
| `ALLOCATION_IN_PROGRESS` | Amber | Yes |
| `ALLOCATION_COMPLETED` | Emerald | No |
| `EXECUTION_PHASE` | Violet | No |
| `ARCHIVED` | Slate | No |

### Event Logistics / Corral Builder (`/logistics/:eventId`)

- Fetches full event detail from `GET /api/v1/logistics/events/:id` via `getEventDetails()`.
- Header renders `name` + `raceDate` + lifecycle status badge using the shared `STATUS_META`.
- `corrals` is a separate writable `signal<CorralDetail[]>` populated from `data.corralConfigurations` — decoupled from the immutable `state` signal so drag-and-drop reordering can mutate it without touching the API response.
- `hasAnyCorrals` is a `computed(() => corrals().length > 0)` — derived automatically from the writable signal.
- **Empty state** (`corrals().length === 0`): dashed-border canvas with icon, copy, and "+ Crear Primer Corral" CTA.
- **Corral Builder** (`corrals().length > 0`): vertical `cdkDropList` with Start Line anchor and draggable corral rows.
- `paramMap` + `switchMap` + `tap()` — navigating between events resets both `state` and `corrals` signals and cancels the previous request.
- 404 from `getEventDetails` propagates as `error` state — the event genuinely does not exist.

### Corral Builder — Drag & Drop

- `DragDropModule` from `@angular/cdk/drag-drop` imported in `EventLogisticsComponent`.
- `cdkDropList` on the container; each row is `cdkDrag` wrapping `<app-corral-card>`.
- `onDrop(event: CdkDragDrop<CorralDetail[]>)` — early-return when `previousIndex === currentIndex`; otherwise `corrals.update(list => { moveItemInArray(copy, prev, curr); return copy; })` — preserves immutability.
- `*cdkDragPreview`: 640 px clone with `rotate-1 shadow-2xl` floats under cursor.
- `*cdkDragPlaceholder`: dashed blue gap shows landing position.
- **Start Line anchor**: static non-draggable emerald bar above the list — flags icon, dashed separator, `00:00:00` timestamp.

### `CorralDetail` model — real backend fields

| Field | Type | Notes |
|---|---|---|
| `corralId` | `string` | |
| `name` | `string` | Display name (replaces old `corralName`) |
| `order` | `number?` | Optional — backend may omit in configuration phase |
| `maleBaseTime` | `string` | ISO 8601 target pace for male athletes |
| `femaleBaseTime` | `string` | ISO 8601 target pace for female athletes |
| `minTime` | `string \| null` | ISO 8601 window start |
| `maxTime` | `string \| null` | ISO 8601 window end |
| `maxCapacity` | `number` | 0 = open corral |
| `registeredCount` | `number?` | Optional — absent until allocation phase; defaults to `0` via `?? 0` |
| `isParaAthleteCorral` | `boolean` | |
| `isRestricted` | `boolean` | |
| `assignedPacers` | `string[]` | List of pacer target-time IDs |

### `StatusMeta` / `STATUS_META` — shared from model

`StatusMeta` interface and `STATUS_META` constant live in `logistics.model.ts` and are imported by both `LogisticsEventListComponent` and `EventLogisticsComponent`. The list component re-exports `STATUS_META` for its own spec's import path compatibility.

### `LogisticsEventDetail` model fields

| Field | Type | Notes |
|---|---|---|
| `eventId` | `string` | |
| `name` | `string` | Displayed in page header |
| `raceDate` | `string` | ISO 8601 date |
| `offerings` | `EventOffering[]` | `{ distance, modality, teamSize }` |
| `isRelay` | `boolean` | |
| `corralConfigurations` | `CorralDetail[]` | Empty array = `CONFIGURATION_PHASE` with no corrals yet |
| `status` | `LogisticsEventStatus` | Drives lifecycle badge |
| `contractedPacers` | `string[]` | |
| `openCorral` | `boolean` | |

### `CorralCardComponent` — command-center card redesign

Horizontal single-row layout (`h-16`) with three data columns separated by dividers:

| Zone | Content |
|---|---|
| Drag handle (36 px) | 6-dot grip icon, `cdkDragHandle`, `cursor-grab` |
| Col 1 — Identity | Order chip + `name` bold + Para / Restricted mini-badges |
| Col 2 — Time Window | Label `10px uppercase` + `font-mono` time range from `parseIsoDuration()` |
| Col 3 — Capacity | `registeredCount ?? 0 / maxCapacity` or `∞ Open` + progress bar |

Computed signals:

| Signal | Logic |
|---|---|
| `timeRange` | Parses `minTime`/`maxTime` via `parseIsoDuration()` — `≤ 3:00h`, `2:00h – 3:00h`, or `--` |
| `occupancyPercent` | `Math.min(100, round((registeredCount ?? 0) / maxCapacity * 100))` — `?? 0` guards optional field |
| `accentClass` | Left border: purple = para-athlete, amber = restricted, slate = standard |
| `occupancyBarClass` | Red ≥ 90%, Amber ≥ 70%, Emerald < 70% |
| `isOpenCapacity` | `!maxCapacity` — renders sky `∞ Open` label and passive bar instead of progress bar |

A11y: `role="progressbar"` with `aria-valuenow/min/max`; `aria-label` on all badges and drag handle.

### Slide-over Panel — Nuevo Corral (`EventLogisticsComponent`)

A fixed `<aside role="dialog" aria-modal="true">` always present in the DOM, translated off-screen when closed. Uses CSS `translate-x-full` ↔ `translate-x-0` transitions (300 ms ease-in-out) driven by the `isSidePanelOpen` signal. A `bg-black/50` backdrop rendered via `@if (isSidePanelOpen())` calls `closePanel()` on click.

#### Form controls (`corralForm: FormGroup`)

| Control | Type | Validators |
|---|---|---|
| `name` | `string` | `required` |
| `minTime` | `string` | optional — format `HH:mm` or `HH:mm:ss` |
| `maxTime` | `string` | optional — format `HH:mm` or `HH:mm:ss` |
| `maxCapacity` | `number` | `required`, `min(0)` |
| `isParaAthlete` | `boolean` | — |
| `isRestricted` | `boolean` | — |
| `maleBaseTime` | `string` | optional — format `HH:mm` or `HH:mm:ss` |
| `femaleBaseTime` | `string` | optional — format `HH:mm` or `HH:mm:ss` |

#### `timeRangeValidator: ValidatorFn` (exported, module-level)

Cross-field validator applied at the `FormGroup` level. Fires only when both `minTime` and `maxTime` have a value; converts both to total seconds via `timeToSeconds()` and returns `{ timeRangeInvalid: true }` when `minSec >= maxSec` (strictly positive window required — equal times produce a zero-duration corral and are rejected). Returns `null` (valid) when either field is empty or unparseable. A `role="alert" aria-live="polite"` error message with a warning icon appears below the time grid when the error is active; both time inputs gain `border-red-500`.

#### Cross-collection overlap validation (`checkTimeOverlap`)

`onSubmit()` performs a second check before mutating the signal: if both `minTime` and `maxTime` are provided, it calls `checkTimeOverlap(newMinSec, newMaxSec, corrals())` from `time.utils.ts`. The function iterates all existing corrals and tests for half-open interval overlap: `newMin < existMax && newMax > existMin`. Boundary touching (a new range that starts exactly at an existing range's end) is **not** an overlap. Corrals with a null `minTime` or `maxTime` are skipped. On overlap, `corralForm.setErrors({ overlap: true })` is called and submission is blocked; an `aria-live="assertive"` error paragraph appears in the HTML.

#### `openPanel()` / `closePanel()` / `onSubmit()`

- `openPanel()` resets the form to clean defaults before opening — prevents stale data if the user closes without saving.
- `onSubmit()` guards on `corralForm.invalid`, then on cross-collection overlap. When both pass, constructs a `CorralDetail` object:
  - `corralId`: `crypto.randomUUID()`
  - `order`: `corrals().length + 1`
  - `minTime` / `maxTime`: converted via `timeStringToIso8601()` → `null` if empty
  - `maleBaseTime` / `femaleBaseTime`: converted via `timeStringToIso8601()` → `'PT0S'` if empty
  - `assignedPacers`: `[]`
  - Then mutates the signal: `corrals.update(list => [...list, newCorral])`

### `LogisticsService` (`src/app/core/services/logistics.service.ts`)

| Method | Endpoint | Returns | Error handling |
|---|---|---|---|
| `getLogisticsEvents(page, size)` | `GET /api/v1/logistics/events?page=&size=` | `Observable<Page<LogisticsEventSummary>>` | Propagates |
| `getEventDetails(eventId)` | `GET /api/v1/logistics/events/:id` | `Observable<LogisticsEventDetail>` | Propagates (404 = event not found) |
| `getCorrals(eventId)` | `GET /api/v1/logistics/events/:id/corrals` | `Observable<CorralsResponse>` | 404 → `of({ corralsByDistance: {} })` |

**Exported pure utilities (re-exported from `time.utils.ts` for backward compatibility):**

| Function | Signature | Description |
|---|---|---|
| `parseIsoDuration(duration)` | `(string \| null \| undefined) → string` | Converts `PT10800S`, `PT1H30M` → `"3:00h"`. Returns `"--"` for null / empty / `PT0S`. |
| `timeStringToIso8601(timeString)` | `(string) → string \| null` | Converts `HH:mm` or `HH:mm:ss` → `PT<n>S`. Returns `null` for empty, bad format, or out-of-range values (minutes > 59, seconds > 59). |

> These functions are defined in `src/app/core/utils/time.utils.ts` and re-exported from `LogisticsService` via `export { ... }` to preserve existing import paths.

---

## Feature: Dashboard — Logistics Command Center (`src/app/features/dashboard/`)

Signal-driven operations overview. State initialized from typed mock signals — swap in real HTTP data requires only replacing the initial signal value, no template changes.

**Metrics grid** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)

| Metric | Mock Value |
|---|---|
| Registered Athletes | 12,450 |
| Active Waves | 8 Waves |
| Corral Capacity | 94% |
| Assigned Pacers | 45 |

**Upcoming Events table** — columns: Event name · Date · Athletes (`DecimalPipe`) · Logistics status badge.

---

## Feature: Auth / Login (`src/app/features/auth/login/`)

Dark-sport UI. Reactive form with strict validators (`Validators.email`, `Validators.minLength(6)`).
On successful login, redirects to `/dashboard`.

**HTTP error handling** — `resolveErrorMessage()` maps status codes to user-facing strings:

| Status | Message |
|---|---|
| `0` | Cannot reach the server. |
| `401` / `403` | Invalid credentials. |
| `>= 500` | The system is under maintenance. |
| other | An unexpected error occurred. |

WCAG 2.1 compliant: `aria-required`, `aria-invalid`, `aria-describedby` on all inputs; `role="alert"` + `aria-live="assertive"` on error regions.

---

## Core Utilities (`src/app/core/utils/`)

### `time.utils.ts` — canonical time helpers

All time conversion logic extracted here to eliminate duplication across the logistics service and component validators.

| Function | Signature | Description |
|---|---|---|
| `timeToSeconds(timeString)` | `(string) → number \| null` | Parses `HH:mm` or `HH:mm:ss` into total seconds. Returns `null` for empty, wrong segment count, non-numeric, or out-of-range values (minutes/seconds > 59). |
| `timeStringToIso8601(timeString)` | `(string) → string \| null` | Wraps `timeToSeconds` — returns `PT<n>S` or `null`. |
| `isoToSeconds(duration)` | `(string \| null \| undefined) → number \| null` | Parses `PT<n>S`, `PT1H30M`, etc. into total seconds. Returns `null` for null, empty, or unrecognised formats. |
| `checkTimeOverlap(newMin, newMax, corrals)` | `(number, number, {minTime, maxTime}[]) → boolean` | Half-open interval `[inclusive, exclusive)` overlap detection across a collection of corrals. Skips corrals missing either bound. |
| `parseIsoDuration(duration)` | `(string \| null \| undefined) → string` | Human-readable display — `"3:00h"`, `"1:30h"`, `"--"`. |

`LogisticsService` re-exports `parseIsoDuration` and `timeStringToIso8601` via `export { ... }` to preserve existing import paths. `CorralCardComponent` imports `parseIsoDuration` directly from `time.utils`.

---

## Core Services (`src/app/core/`)

| Service | Endpoint | Responsibility |
|---|---|---|
| `AuthService` | `POST /api/v1/auth/login` | Authenticates user, persists token to `localStorage`, maintains `isLoggedIn$` BehaviorSubject |
| `EventService` | `GET /api/v1/catalog/events` | Fetches paginated event list; handles both `SpringPage<T>` and plain array responses |
| `EventService` | `PATCH /api/v1/catalog/events/{id}/status` | Publishes a DRAFT event |
| `EventService` | `POST /api/v1/catalog/events` | Creates a new catalog entry (multipart) |
| `LogisticsService` | `GET /api/v1/logistics/events` | Fetches logistics event list with lifecycle status |
| `LogisticsService` | `GET /api/v1/logistics/events/{id}` | Fetches full event detail (`LogisticsEventDetail`) |
| `LogisticsService` | `GET /api/v1/logistics/events/{id}/corrals` | Fetches corral groups by distance (`CorralsResponse`) |

**API Gateway base:** `http://localhost:8080`

## Security Infrastructure (`src/app/core/`)

| Artifact | Type | Responsibility |
|---|---|---|
| `authGuard` | `CanActivateFn` | Blocks unauthenticated access; passes through on SSR to avoid premature redirect |
| `jwtInterceptor` | `HttpInterceptorFn` | Injects `Authorization: Bearer` on every request; calls `logout()` on 401 |

---

## Testing

```bash
ng test
```

Unit tests use Vitest + `HttpTestingController`.

| Spec file | Coverage |
|---|---|
| `auth.service.spec.ts` | init state, login flow, logout + redirect |
| `auth.guard.spec.ts` | browser + SSR platform variants |
| `jwt.interceptor.spec.ts` | header injection, 401 auto-logout |
| `login.component.spec.ts` | form validation, navigation, all HTTP error branches |
| `main-layout.component.spec.ts` | logo render, nav labels, active state, logout delegation, router-outlet |
| `dashboard.component.spec.ts` | metric count, titles/values, trend colors, badge classes, signal reactivity, a11y |
| `event.service.spec.ts` | real HTTP GET with params, SpringPage mapping, plain array client-side pagination, publishEvent PATCH |
| `event-table.component.spec.ts` | skeleton/real rows, toolbar persistence, debounce, badge classes (DRAFT/PUBLISHED), Publish button visibility, publishEvent output |
| `event-list.component.spec.ts` | init call, skeleton, isLoading, search reset, page change, optimistic publish update |
| `event-create.component.spec.ts` | futureDateValidator, enum constants (incl. CUSTOM), FormArray init, add/remove offering, CUSTOM conditional validators, name & raceDate validators, file selection, onSubmit guards, HTTP happy path, error, isLoading, DOM button state (39 cases) |
| `logistics.service.spec.ts` | `parseIsoDuration` (10 cases), `getEventDetails` GET URL + 200 + 404/500 propagation, `getCorrals` GET URL + 404→empty + 500 propagation, `getLogisticsEvents` default + custom params |
| `logistics-event-list.component.spec.ts` | create, loading state, loaded transition, error state, `getStatusMeta` label, row count per event, openCorral badge visibility, empty state, routerLink target |
| `time.utils.spec.ts` | `timeToSeconds` (9), `timeStringToIso8601` (9), `isoToSeconds` (9), `checkTimeOverlap` (14 — empty list, before, after, boundary touch ×2, starts inside, ends inside, fully contains, contained, partial bounds ×3, multi-corral overlap, multi-corral clear), `parseIsoDuration` (10) = **51 cases** |
| `event-logistics.component.spec.ts` | create, loading/loaded/error states, 404→error, header name + status badge, card count, empty-state heading, "+ Crear Primer Corral" CTA, `getStatusMeta` label, `onDrop` reorder, `onDrop` no-op same-index, panel open/close/reset, CSS translate classes, form validity, `onSubmit` close/no-close, `onSubmit` signal mutation, ISO 8601 mapping, null minTime, `timeRangeInvalid` guard, maleBaseTime/femaleBaseTime ISO 8601, PT0S defaults, overlap blocks mutation + sets error, no-overlap proceeds, empty minTime skips check, empty maxTime skips check (46 cases) · `timeRangeValidator` standalone: empty/partial/valid/equal/invalid/unparseable/seconds-precision/zero-duration edge case (10 cases) |
| `logistics.service.spec.ts` | HTTP tests only — `getEventDetails` GET URL + 200 + 404/500, `getCorrals` GET URL + 404→empty + 500, `getLogisticsEvents` default + custom params (pure utility tests moved to `time.utils.spec.ts`) |

---

## Key Architectural Decisions

- `inject()` over constructor injection throughout — aligns with Angular 14+ functional DI style.
- `signal()` for synchronous component state; RxJS only for async streams.
- `provideHttpClient(withFetch())` — fetch-based HTTP adapter, required for SSR hydration compatibility.
- All component `.css` files are empty; layout is 100% Tailwind utility classes.
- `isPlatformBrowser(PLATFORM_ID)` guards all `localStorage` access — safe for SSR server bundle.
- `authGuard` returns `true` on `isPlatformServer` — prevents SSR from redirecting before browser hydration reads `localStorage`.
- `authGuard` placed at the layout shell level — single point of protection for the entire authenticated surface.
- `app.routes.server.ts` uses `RenderMode.Client` for `**` and `RenderMode.Prerender` only for `/login` — using `Prerender` on `**` caused `NG04002` for routes not pre-rendered at build time.
- `@let s = state()` in logistics templates captures the signal snapshot once per render cycle, enabling TypeScript control-flow narrowing inside `@if` blocks.
- `StatusMeta` and `STATUS_META` promoted from `logistics-event-list.component.ts` to `logistics.model.ts` — shared across list and detail components; list component re-exports `STATUS_META` for spec import compatibility.
- `EventLogisticsComponent` consumes `getEventDetails()` (not `getCorrals()`) — the detail endpoint returns `corralConfigurations` as a flat array, eliminating the `distanceKeys` fan-out and the stale `hasAnyCorrals()` method that caused the post-refactor `TypeError`.
- `.angular/cache` cleared after refactor — Angular's incremental compiler cached the old compiled template bytecode referencing the removed `hasAnyCorrals()` method; hard cache invalidation is the correct fix.
- `getCorrals` 404 → `of({ corralsByDistance: {} })` kept for resilience on the corrals sub-endpoint; `getEventDetails` 404 propagates as a real error — semantically different: no corrals is a valid configuration state, but no event means the route is wrong.
- `corrals` signal in `EventLogisticsComponent` is a separate writable copy of `data.corralConfigurations` — drag-and-drop reordering mutates only the local signal, keeping the API response in `state` immutable. `hasAnyCorrals` is a `computed()` derived from `corrals`, not from `state.data`.
- `moveItemInArray` (CDK) operates on a spread copy inside `corrals.update()` — preserves immutability; Angular's signal diffing detects the new array reference and re-renders.
- `registeredCount` is optional in `CorralDetail` (absent during `CONFIGURATION_PHASE`). The `occupancyPercent` computed uses `registeredCount ?? 0` to prevent `NaN` — without it, `undefined / maxCapacity` produces `NaN` which propagates through `Math.min(100, Math.round(NaN))` and causes a runtime `TypeError` in all four template expressions that consume `occupancyPercent()`.
- `CorralCardComponent` uses `input.required<CorralDetail>()` + `computed()` exclusively — all derived values re-evaluate only when the input signal changes.
- `parseIsoDuration` and `timeStringToIso8601` are pure exported functions — unit-testable in isolation without `TestBed`.
- `timeStringToIso8601` is the inverse of `parseIsoDuration` — used by `onSubmit()` to convert form input (`HH:mm`) to the ISO 8601 duration contract expected by the backend.
- `timeRangeValidator` is exported at module level (not a method) so it can be unit-tested in a standalone `describe` block without triggering the `TestBed` / HTTP mock lifecycle of the component suite.
- `timeRangeValidator` uses `minSec >= maxSec` (not `>`): equal times are invalid because a zero-duration corral bypasses overlap detection — a corral `[1:05, 1:05)` has zero width and would never conflict with anything, allowing silent data corruption.
- All time-conversion logic lives in `src/app/core/utils/time.utils.ts` — extracted from `LogisticsService` to eliminate duplication between the service, the `timeRangeValidator`, and `onSubmit()`. The service re-exports the two functions needed by existing consumers.
- `checkTimeOverlap` uses half-open interval semantics `[inclusive, exclusive)`: `newMin < existMax && newMax > existMin`. Boundary touching (a corral starting exactly where another ends) is **not** an overlap — runners from back-to-back time windows should both be admissible.
- The `overlap` error is set on the `FormGroup` (not a field control) after the `corralForm.invalid` guard — prevents double-error states and ensures the check only runs when the form is structurally valid.
- `isoToSeconds` parses `PT<n>H<m>M<s>S` ISO 8601 durations from stored corrals; `timeToSeconds` parses `HH:mm` form inputs. Both are needed because different layers use different time representations.
- `onSubmit()` in `EventLogisticsComponent` mutates only the local `corrals` signal — no API call yet. The new `CorralDetail` gets `maleBaseTime`/`femaleBaseTime` from the form, falling back to `'PT0S'`.
- `crypto.randomUUID()` generates the temporary `corralId` for optimistic local state — guaranteed unique per session, replaced by the backend-assigned ID when the save endpoint is wired.
- `order` is assigned as `corrals().length + 1` at submit time — reflects the append-to-bottom position; will be reconciled against the backend response when the POST is added.
- `PageState` discriminated union (`loading | loaded | error`) is the standard state container for all data-fetching Smart components.
- `eventsPage` is a writable `signal<EventsPage>` rather than `toSignal()` — necessary for `signal.update()` in the optimistic publish path.
- `EventService.getEvents` handles both `SpringPage<T>` and `T[]` responses via `Array.isArray` — plain arrays are sliced client-side to preserve pagination UX.
- `DestroyRef` injected once at component level and passed to every `buildOffering()` call — all `valueChanges` subscriptions share the same lifecycle boundary.
- File upload trigger uses `fileInput.click()` on a `display:none` input — `sr-only` absolute-positioned inputs cause scroll-jump when focused before the OS file picker opens.
- `html/body/app-root` constrained to `height: 100%; overflow: hidden` in `styles.css` — makes `<main>` the sole scroll container and eliminates the phantom blank strip at the bottom of long pages.
