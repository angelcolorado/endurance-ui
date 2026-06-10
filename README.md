# EnduranceOps UI

Angular 21 SPA — micro-frontend client for the EnduranceOps race logistics platform.

## Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (Standalone Components, SSR) |
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
| `/dashboard` | `DashboardComponent` | `authGuard` | Lazy (`loadComponent`) |

## Feature: Auth / Login (`src/app/features/auth/login/`)

Dark-sport UI. Reactive form with strict validators (`Validators.email`, `Validators.minLength(6)`).
On successful login, redirects to `/dashboard`. API error surfaces via `hasError` signal.

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

Unit tests use Vitest + `HttpTestingController`. Coverage: `AuthService` (init, login, logout), `authGuard` (browser + SSR platforms), `jwtInterceptor` (header injection, 401 handling).

## Key Architectural Decisions

- `inject()` over constructor injection throughout — aligns with Angular 14+ functional DI style.
- `signal()` for synchronous component state (`isLoading`, `hasError`); RxJS only for async streams.
- `provideHttpClient(withFetch())` — fetch-based HTTP adapter, required for SSR hydration compatibility.
- All component `.css` files are empty; layout is 100% Tailwind utility classes.
- `isPlatformBrowser(PLATFORM_ID)` guards all `localStorage` access — safe for SSR server bundle.
- `AuthService` owns `logout()` navigation to `/login` — guards and interceptors call one place.
- `authGuard` returns `true` on `isPlatformServer` — prevents SSR from redirecting before browser hydration reads `localStorage`.
- `jwtInterceptor` registered via `withInterceptors([])` (functional API) — compatible with `withFetch()` and tree-shakeable.
