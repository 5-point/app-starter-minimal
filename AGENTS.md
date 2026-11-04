# ERP Minimal App — AI conventions

Instructions for AI coding sessions working inside this template.

## Prerequisites

Running this app needs one tool on the machine: **Node.js** (version 22 or
newer) — **npm** ships with it and is the package manager. The person driving
this session may be non-technical — do not assume it is installed. Before the
first command, check `node -v`; if it is missing or outdated, walk the user
through it with short, copy-paste-ready steps (Node.js from nodejs.org) and
plain-language explanations — never fall back to yarn/pnpm as a workaround.

Install dependencies once with `npm install` in the template's top-level
folder (the one containing `package.json`).

## Commands

Run inside the template folder:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | `tsc --noEmit` |

Verify changes with `npm run typecheck` at minimum; run `npm run build`
before handing anything back.

## Purpose

**Empty starting template** for apps that talk to a real ERP server: login
page (server URL + ERP login or device access), authenticated app shell,
placeholder home page. No mock mode, no mock data, no entity pages. When the
user asks for a working screen against real ERP data, add it here following
the rules below.

## Hard rules

- **The API client is a frozen snapshot.** Everything under
  `src/lib/api-client/` (`generated/`, `zod/`, `mutator/custom-instance.ts`)
  is a vendored, generated snapshot — never edit it and never add
  regeneration tooling (there is no orval in this template). Upgrading means
  re-copying a newer generated snapshot over the folder (no mock files to
  strip — the client is generated with `mock: false`; see
  `src/lib/api-client/README.md`) and fixing any fallout in app code, never
  in the snapshot.
- **Never call `fetch` in UI code.** All data access goes through generated
  hooks/functions from `@/lib/api-client` (the barrel at
  `src/lib/api-client/index.ts`). The only sanctioned direct calls
  are the generated `postDevice`/`getDeviceById` inside `src/auth/auth.tsx`.
- **Never bypass or weaken the auth guard.** New pages go under the pathless
  `_app` layout route; it redirects to `/login` when no device session exists.
- **Never log or render tokens.** The device token is a long-lived credential;
  it lives only in `localStorage` and in the `Authorization` header.
- **No mock mode.** The app always talks to the server URL from the login
  page. Do not add MSW browser workers, seed data, or a `VITE_USE_MOCKS`
  switch. The template ships no test setup either — add your own stack (e.g.
  Vitest + Testing Library + MSW) when the app grows one.
- **The server URL is user input, not build config.** Normalize/validate with
  `src/lib/server-url.ts` (`applyServerUrl` before any auth request,
  `storeServerUrl` only after a successful login; both storage keys are
  `minimal.session` and `minimal.server-url`). `VITE_API_BASE_URL` is a
  convenience prefill, never a required setting.

## Auth model (device login)

Every signed-in user owns an ERP **device**: all API calls carry
`Authorization: Basic base64(deviceId:token)` via `apiAuthHeaders()`
(`src/auth/auth.tsx`), wired into `configureApiClient` in `src/main.tsx`.
Two login paths produce the same stored session (`localStorage`,
`minimal.session`):

1. **ERP login** — user's normal email + password provisions a device via
   `POST /api/device { email, password, deviceName, deviceType }` (201 →
   `_id` + `token`). One device per app/browser.
2. **Device access** — existing device id + device password (ERP user
   settings "Gerätepasswort & API-Token"), verified via `GET /api/device/{id}`.

Devices belonging to external contacts (`externalAccess: true`) are rejected —
this app is for ERP users only. Logout drops the stored credentials
client-side; the device stays registered in the ERP until revoked there (or
`DELETE /api/device/{id}` is called). Device responses are untyped/loose —
always parse them with the zod schema in `src/auth/auth.tsx`, never cast.

## Conventions

- **Routing:** file-based (`src/routes/`) with **hash history**
  (`createHashHistory` in `src/main.tsx`) — the app runs from any static path
  or origin without server rewrites; never switch to browser history without
  updating the README rationale. Authenticated pages live under the pathless
  `_app` layout route (guard + app shell). Regenerate `routeTree.gen.ts` with
  any `vite dev`/`vite build` run. Route search params are validated
  with `validateSearch` + zod (see `src/routes/login.tsx`).
- **Features:** one folder per concern in `src/features/<area>/`, page
  component plus colocated helpers. Wire the route under `src/routes/_app.*`,
  add a nav entry in `src/components/app-shell.tsx`.
- **Data queries:** build hooks on the generated query hooks; the fetch client
  resolves every HTTP status into `{ data, status }` instead of throwing, so
  normalize non-200 statuses into errors when the first data page arrives:

  ```ts
  export class ApiError extends Error {
    constructor(readonly status: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  }

  export function toApiResult<T>(result: { data: T; status: number }, context: string): T {
    if (result.status < 200 || result.status >= 300) {
      throw new ApiError(result.status, `${context} failed (HTTP ${result.status}).`);
    }
    return result.data;
  }
  ```
- **Snapshot upgrades:** after re-copying a newer generated snapshot (new
  OpenAPI baseline), check that every generated function the app calls still
  points where the UI expects — duplicate operationIds get stable
  path-derived names (e.g. `getPdfInvoice`), so names only change when
  upstream changes the path itself.
- **Styling:** Tailwind v4 with CSS variables defined in `src/index.css`.
  Components in `src/components/ui/` are shadcn-style, hand-written and
  dependency-light (no Radix yet); extend them rather than adding UI libs.
