# Adviserz web

Web frontend for Adviserz. Talks to the `adviserz_be` API.

**Stack:** Next.js 16 (App Router, Turbopack, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zod

## Getting started

Requires Node.js 24+ (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # then adjust if your backend is not on :4000
npm run dev                  # http://localhost:3000
```

The backend must list this app's origin in `CORS_ALLOWED_ORIGINS` (it already includes `http://localhost:3000`).

## Scripts

| Script              | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Start the dev server                                  |
| `npm run build`     | Production build                                      |
| `npm run start`     | Serve the production build                            |
| `npm run lint`      | ESLint, warnings fail                                 |
| `npm run typecheck` | Generate route types, then `tsc --noEmit`             |
| `npm run format`    | Format with Prettier                                  |
| `npm run check`     | Format check + lint + typecheck (run before a commit) |

## Environment variables

Defined in `.env.example`, validated at startup by `src/config/env.ts` — the app refuses to start or build with a missing or malformed value.

`NEXT_PUBLIC_*` values are inlined into the browser bundle at **build time**. Set them before `npm run build`; never put secrets in them.

## Project structure

```
src/
  app/              Routes only. Pages are thin: metadata + one feature component
    (auth)/         Login, signup, OTP and password-reset routes, sharing one layout
  components/
    ui/             Reusable, feature-agnostic building blocks (Button, TextField,
                    PhoneField, OtpInput, Checkbox, SegmentedTabs, ...)
    brand/          Logo
  features/<name>/  Everything specific to one feature
    api/            Endpoint calls and their request/response types
    hooks/          TanStack Query hooks wrapping the api/ calls
    schemas/        Zod validation for the feature forms
    components/     Feature components, composed from components/ui
    lib/            Feature state and helpers
  hooks/            Reusable hooks (useCountdown)
  providers/        App-wide client providers (TanStack Query)
  config/           env.ts (validated env), site.ts
  lib/
    api/            API client, ApiError, error codes shared with the backend
    query/          QueryClient setup and defaults
    auth/           In-memory access-token session
    storage/        Typed sessionStorage store
    utils/          cn, formatters
```

Rules of thumb:

- A component used by more than one feature lives in `components/ui` and is configured through props. Build it once; never copy it.
- Components never call `fetch` or `api` directly. They use a hook from `features/<name>/hooks`, which uses TanStack Query.
- Forms use React Hook Form with a Zod schema from `features/<name>/schemas`.

## Calling the API

```ts
import { api, isApiError, ErrorCode } from "@/lib/api";

try {
  const result = await api.get<{ available: boolean }>(
    "/auth/username-availability",
    { query: { username: "eknoor" } },
  );
} catch (error) {
  if (isApiError(error) && error.is(ErrorCode.RATE_LIMITED)) {
    // error.retryAfterSeconds, error.requestId, error.details
  }
}
```

The client unwraps the backend's `{ success, message, data, requestId }` envelope, always sends cookies, and throws an `ApiError` for every failure, including network errors and timeouts. Branch on `error.code`, never on `error.message`.

`src/lib/api/error-codes.ts` mirrors `adviserz_be/src/common/errors/errorCodes.ts`. Update both together.

## Conventions

- Next.js 16 differs from earlier versions. Check `node_modules/next/dist/docs/` before using an unfamiliar API (see `AGENTS.md`).
- Use the semantic colors from `src/app/globals.css` (`bg-background`, `text-muted-foreground`, `bg-primary`), not raw palette values.
- Import with the `@/` alias, which maps to `src/`.
