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

| Path | Component | Strategy |
|---|---|---|
| `/` | — | Redirects to `/login` |
| `/login` | `LoginComponent` | Lazy (`loadComponent`) |
| `/dashboard` | `DashboardComponent` | Lazy (`loadComponent`) |

## Feature: Auth / Login (`src/app/features/auth/login/`)

Dark-sport UI. Reactive form with strict validators (`Validators.email`, `Validators.minLength(6)`).
On successful login, redirects to `/dashboard`. API error surfaces via `hasError` signal.

## Core Services (`src/app/core/`)

| Service | Endpoint | Responsibility |
|---|---|---|
| `AuthService` | `POST /api/v1/auth/login` | Authenticates user, maintains `isLoggedIn$` BehaviorSubject |

**API Gateway base:** `http://localhost:8080`

## Key Architectural Decisions

- `inject()` over constructor injection throughout — aligns with Angular 14+ functional DI style.
- `signal()` for synchronous component state (`isLoading`, `hasError`); RxJS only for async streams.
- `provideHttpClient(withFetch())` — fetch-based HTTP adapter, required for SSR hydration compatibility.
- All component `.css` files are empty; layout is 100% Tailwind utility classes.
