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
        └── /dashboard → DashboardComponent
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
