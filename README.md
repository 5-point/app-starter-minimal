# teamspace Minimal App — React template

An **empty starting template** for building your own
[teamspace](https://www.teamspace.de/) ERP app with an AI coding
agent. It ships the part every app needs — a login page that connects to a
real teamspace server, real device authentication, and a typed API
client — and nothing else. No mock data, no example screens: clone it, open
it in your coding agent, and grow it into the app you need.

## What you get

- **Login page** with a server URL input — the template works against any
  teamspace instance, entered per deployment (no build config needed)
- **Real device authentication** — users sign in with their normal ERP
  credentials (or a device id + device password); every API call carries
  the resulting device token
- **Authenticated app shell** — placeholder home page behind an auth guard,
  hash-based routing so the build runs from any static path
- **Typed API client, vendored and frozen** — generated from the
  teamspace OpenAPI documentation, so the agent can browse real types
  and query hooks immediately, with zero build tooling for regeneration

## Who this is for

Teams building custom teamspace apps with AI assistance ("vibe
coding"). The template includes an `AGENTS.md` with conventions your
coding agent reads automatically — it explains the auth model, the rules
for extending the app safely, and how to add the first real screens. Just
point your agent at the repo and start describing what you want.

## Quickstart

Requires Node.js 22+ (npm ships with it). Plain npm — no workspace, no
pnpm.

```sh
git clone <this repo> my-teamspace-app && cd my-teamspace-app
npm install
npm run dev
```

Open http://localhost:5173. The login page asks for:

| Field | Meaning |
| --- | --- |
| **Server URL** | Base URL of your teamspace instance, e.g. `https://firma.teamspace.de` (scheme defaults to `https://`) |
| ERP login | Your normal ERP email + password — provisions a device via `POST /api/device` |
| Device access | Existing device id + device password ("Gerätepasswort & API-Token" in the ERP user settings) |

Both login paths store the same session (`localStorage`, `minimal.session`)
and send `Authorization: Basic base64(deviceId:token)` on every API call.
After a successful login the server URL is persisted too (`minimal.server-url`)
and the API client is reconfigured with it on the next visit. Logout drops the
stored device credentials client-side; the device stays registered in the ERP
until revoked in the user settings.

### Optional: prefill the server URL

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to prefill
the server URL input as a build-time default. Leaving it empty (the
default) makes the app same-origin — useful when you deploy it next to the
teamspace server.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (http://localhost:5173) |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | `tsc --noEmit` |

## Project layout

- `src/auth/auth.tsx` — device session (login via credentials or device id,
  storage, Basic auth headers, logout)
- `src/lib/server-url.ts` — server URL normalization/validation, API client
  wiring, persistence
- `src/lib/api-client/` — **frozen, vendored API client** (generated
  snapshot from the teamspace OpenAPI spec `2026.3.27`, see its
  `README.md`); never edited by hand, upgraded by re-copying a newer
  snapshot
- `src/features/auth/login-page.tsx` — login form with server URL input
- `src/features/home/home-page.tsx` — placeholder page showing the session
- `src/routes/` — TanStack Router file-based routes with hash history
  (deployable from any static path), `_app` layout route as auth guard
- `src/components/ui/` — shadcn-style Button, Card, Input
- `AGENTS.md` — conventions for AI coding sessions (read this first — or
  better, let your agent read it)

## Included API version

The vendored client is a generated snapshot of the teamspace OpenAPI
documentation, version `2026.3.27`. It is generated code — never edit it by
hand (details in `src/lib/api-client/README.md`). Newer snapshots ship with
new releases of this template; check the release notes for which API
version each release carries.

## License

[MIT](./LICENSE) — © 5 POINT AG
