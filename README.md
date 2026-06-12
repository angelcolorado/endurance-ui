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
├── /login          → LoginComponent          (public)
└── ''  [authGuard] → MainLayoutComponent     (protected shell)
        ├── /dashboard → DashboardComponent  (logistics command center)
        └── /events    → EventListComponent  (Smart) → EventTableComponent (Presentational)
```

## Feature: Application Shell (`src/app/core/layout/main-layout/`)

Full-viewport dashboard layout (`h-screen overflow-hidden flex`) with three zones:

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

Implements the Smart / Presentational pattern for read-only event browsing.

### Architecture

| Component | Role | Responsibilities |
|---|---|---|
| `EventListComponent` | Smart / Container | Injects `EventService`, owns `currentPage` + `searchTerm` + `isLoading` signals, wires HTTP via `toSignal()` |
| `EventTableComponent` | Presentational / Dumb | Renders table, search bar, pagination; emits `pageChange` and `searchChange`; has zero service dependencies |

### Reactivity pattern

- `toSignal()` with `initialValue` — no manual `subscribe`/`unsubscribe`, no `ngOnDestroy`.
- `switchMap` in the stream cancels in-flight requests on rapid page/search changes.
- Search input uses `Subject<string>` + `debounceTime(300)` + `distinctUntilChanged()` + `takeUntilDestroyed()` — prevents a request per keystroke and eliminates duplicate emissions.

### UX — Skeleton loading (no focus loss)

`isLoading` is passed as an `input()` to `EventTableComponent`. The toolbar and `<thead>` are **never destroyed** — only the `<tbody>` swaps between skeleton `<tr>` rows and real data. This fixes the critical bug where `@if` wrapping the entire component destroyed the search `<input>` and caused focus loss after the first keystroke.

### `EventService` (`src/app/core/services/event.service.ts`)

- `getEvents(page, limit, search?)` returns `Observable<EventsPage>` with 800ms simulated latency.
- 12 mock events covering all four statuses: `Active`, `Upcoming`, `Completed`, `Cancelled`.
- Server-side filtering and pagination implemented against the mock dataset — drop-in ready for a real `HttpClient` call.

### Status badge colors

| Status | Color |
|---|---|
| Active | Emerald |
| Upcoming | Blue |
| Completed | Slate |
| Cancelled | Red |

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
| `event.service.spec.ts` | pagination, search filter, whitespace trim, empty results, 800ms delay |
| `event-table.component.spec.ts` | skeleton/real rows, toolbar persistence, debounce (299ms/300ms), collapse, distinctUntilChanged, badge classes, pagination guards |
| `event-list.component.spec.ts` | init call, skeleton visible, table visible post-load, isLoading state, search reset, page change |

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
