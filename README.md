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

### Nested Route Architecture

Authenticated routes are nested under `MainLayoutComponent`, which acts as the protected shell. The `authGuard` is applied once at the layout level — any route added under `children` is automatically protected.

```
AppRoutes
├── /login           → LoginComponent          (public)
└── ''  [authGuard]  → MainLayoutComponent     (protected shell)
        ├── /dashboard   → DashboardComponent
        ├── /events      → EventListComponent  (Smart) → EventTableComponent (Presentational)
        └── /events/new  → EventCreateComponent
```

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

- File upload uses a `<button>` + `#fileInput` template reference with `class="hidden"` — avoids the `sr-only` scroll-jump bug (absolute-positioned inputs cause the scroll container to jump when focused before the OS file picker opens).
- Global scroll fix: `html, body { height: 100%; overflow: hidden }` + `app-root { display: block; height: 100% }` in `styles.css` ensures `<main>` is the sole scroll surface — eliminates the blank strip visible at the bottom of long forms.
- Layout shell uses `h-full` instead of `h-screen` — stable against OS dialog viewport changes.
- Submit button is `disabled` until `form.valid && selectedFile` — no silent empty submissions.
- CUSTOM distance row appears only via `@if (offering.get('distance')?.value === 'CUSTOM')` — zero DOM footprint for standard distances.
- Conditional validators applied via `distance.valueChanges` + `takeUntilDestroyed(destroyRef)` — no manual `ngOnDestroy`, subscription cleaned up automatically when the component is destroyed. Switching away from CUSTOM resets both fields and clears validators immediately.

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
- Logout button — delegates to `authService.logout()` which clears the token and redirects to `/login`.

**Content area** (`flex-1 overflow-y-auto p-6 bg-slate-950`)
- Houses `<router-outlet>` for all child routes.

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
- Search input uses `Subject<string>` + `debounceTime(300)` + `distinctUntilChanged()` + `takeUntilDestroyed()`.

### Publish flow — optimistic update

`onPublishEvent(eventId)` calls `EventService.publishEvent()` (`PATCH .../status`). On `next`, it calls `eventsPage.update()` to map the matching event to `status: 'PUBLISHED'` in-place — the table updates instantly with no refetch and no flicker. No error rollback is implemented (out of scope for this milestone).

### UX — Skeleton loading (no focus loss)

`isLoading` is passed as `input()` to `EventTableComponent`. Only `<tbody>` swaps between skeleton rows and real data — toolbar and `<thead>` are never destroyed, preserving search input focus.

### `EventService` (`src/app/core/services/event.service.ts`)

- `getEvents(page, limit, search?)` — real `HttpClient.get` to `/api/v1/catalog/events`. Handles both `SpringPage<T>` (paginated object) and plain `T[]` responses. Plain array is sliced client-side until the backend adds server-side pagination.
- `publishEvent(eventId)` — `PATCH /api/v1/catalog/events/{id}/status` with `{ status: 'PUBLISHED' }`.
- `createCatalogEntry(file, data)` — multipart POST, unchanged.

### Status badge colors

| Status | Color |
|---|---|
| DRAFT | Amber |
| PUBLISHED | Emerald |

### Actions column

A `Publish` button (ghost/outline, emerald) appears only when `event.status === 'DRAFT'`. Published events show an empty cell — no action available.

## Feature: Dashboard — Logistics Command Center (`src/app/features/dashboard/`)

Signal-driven operations overview. No services or HTTP calls — state is initialized from typed mock signals and will be replaced with real API calls in a future sprint.

**Metrics grid** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)

| Metric | Mock Value |
|---|---|
| Registered Athletes | 12,450 |
| Active Waves | 8 Waves |
| Corral Capacity | 94% |
| Assigned Pacers | 45 |

Each card renders: title, value (`text-3xl tabular-nums`), trend arrow (emerald = up, red = down), and a color-accented icon.

**Upcoming Events table**

Columns: Event name · Date · Athletes (formatted with `DecimalPipe`) · Logistics status badge.

Badge color coding:

| Status | Color |
|---|---|
| Approved | Emerald |
| Under Review | Amber |
| Pending | Slate |

**Interfaces exported:** `SummaryMetric`, `UpcomingEvent`, `LogisticsStatus` — available for reuse when connecting to real API data.

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

WCAG 2.1 compliant: `aria-required`, `aria-invalid`, `aria-describedby` on all inputs; `role="alert"` + `aria-live="assertive"` on error regions; all decorative SVGs marked `aria-hidden`.

## Core Services (`src/app/core/`)

| Service | Endpoint | Responsibility |
|---|---|---|
| `AuthService` | `POST /api/v1/auth/login` | Authenticates user, persists token to `localStorage`, maintains `isLoggedIn$` BehaviorSubject |
| `EventService` | `GET /api/v1/catalog/events` | Fetches paginated event list; handles both `SpringPage<T>` and plain array responses |
| `EventService` | `PATCH /api/v1/catalog/events/{id}/status` | Publishes a DRAFT event |
| `EventService` | `POST /api/v1/catalog/events` | Creates a new catalog entry (multipart) |

**API Gateway base:** `http://localhost:8080`

## Security Infrastructure (`src/app/core/`)

| Artifact | Type | Responsibility |
|---|---|---|
| `authGuard` | `CanActivateFn` | Blocks unauthenticated access; passes through on SSR to avoid premature redirect |
| `jwtInterceptor` | `HttpInterceptorFn` | Injects `Authorization: Bearer` on every request; calls `logout()` on 401 |

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
| `event-create.component.spec.ts` | futureDateValidator, enum constants (incl. CUSTOM), FormArray init, add/remove offering, CUSTOM conditional validators (optional/required/min/reset), name & raceDate validators, file selection, onSubmit guards, HTTP happy path, error, isLoading, DOM button state (39 cases) |

## Key Architectural Decisions

- `inject()` over constructor injection throughout — aligns with Angular 14+ functional DI style.
- `signal()` for synchronous component state (`isLoading`, `errorMessage`); RxJS only for async streams.
- `provideHttpClient(withFetch())` — fetch-based HTTP adapter, required for SSR hydration compatibility.
- All component `.css` files are empty; layout is 100% Tailwind utility classes.
- `isPlatformBrowser(PLATFORM_ID)` guards all `localStorage` access — safe for SSR server bundle.
- `AuthService` owns `logout()` navigation to `/login` — guards and interceptors call one place.
- `authGuard` returns `true` on `isPlatformServer` — prevents SSR from redirecting before browser hydration reads `localStorage`.
- `jwtInterceptor` registered via `withInterceptors([])` (functional API) — compatible with `withFetch()` and tree-shakeable.
- `authGuard` placed at the layout shell level, not on individual child routes — single point of protection for the entire authenticated surface.
- Dashboard state initialized as typed `signal<SummaryMetric[]>` / `signal<UpcomingEvent[]>` — swapping in real HTTP data requires only replacing the initial value, no template changes.
- `getBadgeClasses()` is a pure method with no DOM access — directly unit-testable without `fixture.detectChanges()`.
- `EventTableComponent` receives `isLoading` as an `input()` and swaps only the `<tbody>` — the `<input>` and `<thead>` survive every loading cycle, preventing focus loss on search.
- Search debounce lives entirely in the Presentational component (`Subject` + `debounceTime(300)` + `distinctUntilChanged` + `takeUntilDestroyed`) — the Smart component never sees raw keystrokes.
- `switchMap` in `EventListComponent` cancels stale requests automatically; no explicit unsubscribe needed.
- `eventsPage` is a writable `signal<EventsPage>` rather than `toSignal()` — necessary for `signal.update()` in the optimistic publish path. `toSignal()` returns a readonly signal; mutating it in-place is not possible.
- `EventService.getEvents` handles both `SpringPage<T>` and `T[]` responses via `Array.isArray` — plain arrays are sliced client-side to preserve pagination UX while the backend still returns an unpage list.
- `RaceEvent.registeredAthletes` is optional (`?`) in the model — the backend does not return it yet; the template uses `?? 0` as a safe fallback for `DecimalPipe`.
- `EventService.createCatalogEntry` accepts `Record<string, unknown>` and spreads `documentVersion: '1.0'` immutably before serializing — the form never holds a field that the user shouldn't control.
- `DestroyRef` injected once at component level and passed to every `buildOffering()` call — all `valueChanges` subscriptions share the same lifecycle boundary without creating multiple destroy hooks.
- File upload trigger uses `fileInput.click()` on a `display:none` input rather than the `sr-only` label trick — `sr-only` absolute-positioned inputs cause scroll-jump when the browser focuses them before opening the OS file picker.
- `html/body/app-root` constrained to `height: 100%; overflow: hidden` in `styles.css` — makes `<main>` the sole scroll container and eliminates the phantom blank strip at the bottom of long pages.
