# AGENTS.md

## Project Overview

CodeOrient — a Next.js 16 App Router application (TypeScript, React 19) for AI-powered
GitHub code search and onboarding. Uses Vercel AI SDK v5 with OpenAI/Perplexity, Prisma +
PostgreSQL (Neon), Upstash Vector for RAG, Redis for caching, Sentry for monitoring,
better-auth for GitHub/Google OAuth, and shadcn/ui (new-york style) with Tailwind CSS v4.

## Build / Lint / Test Commands

```bash
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # prisma migrate deploy && prisma generate && next build --turbopack
npm run start        # Start production server
npm run lint         # Run ESLint (next/core-web-vitals + next/typescript)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create a new migration
```

**Testing:** No test framework is currently installed. If tests are added, use Vitest
(recommended for Next.js App Router projects).

**CI:** GitHub Actions runs lint and build on pushes/PRs to `main` and `dev` branches
(Node 20.9.x). See `.github/workflows/ci.yml`.

## Project Structure

```
src/
  actions/     # Server actions ("use server") for data mutations
  ai/          # AI tool definitions (tools.ts) and prompts (prompts.ts)
  app/         # Next.js App Router — pages, layouts, API routes
    api/       # Route handlers (chat/, auth/, indexing/)
    chat/      # Chat feature (pages + co-located components/)
    dashboard/ # Dashboard page + components/
    settings/  # Settings page + components/
    auth/      # Login/signup pages
  components/  # Shared components; ui/ = shadcn primitives (use `npx shadcn add`)
  hooks/       # Custom React hooks
  lib/         # Infrastructure clients and utilities
  services/    # Business logic (repo-indexer.ts)
  types/       # Shared TypeScript types and Zod schemas
prisma/        # Schema and migrations
```

Each route segment co-locates its components in a `components/` subdirectory.

## Code Style

### Formatting (Prettier)

- Double quotes, semicolons, 2-space indentation
- Trailing commas: ES5 style
- Always use arrow parens: `(x) => ...`
- Line endings: LF
- Config is in `.prettierirc` (note: filename typo, missing an "r")

### Imports

- ES modules only (`import`/`export`), never CommonJS
- Use the `@/*` path alias (maps to `./src/*`) for all non-relative imports
- Order: external packages -> `@/` aliased imports -> relative `./` imports
- Prefer named exports; use default exports only for Next.js pages/layouts/routes

### TypeScript

- Strict mode is enabled (`"strict": true` in tsconfig)
- Use `type` (not `interface`) for all type definitions
- Use Zod schema-first pattern with `z.infer<typeof schema>` for types needing validation
- Use `as` for type assertions when needed
- Shared types go in `src/types/`; co-locate component prop types with the component

### Naming Conventions

| Element               | Convention          | Example                        |
|-----------------------|---------------------|--------------------------------|
| Variables, functions  | camelCase           | `getUserChats`, `isLoading`    |
| Components, types     | PascalCase          | `ChatPanel`, `MessagePartType`|
| Module-level constants| UPPER_SNAKE_CASE    | `MAX_RETRIES`, `SYSTEM_PROMPT`|
| Files, directories    | kebab-case          | `chat-panel.tsx`, `ui-message-actions.ts` |
| Database enums        | UPPER_SNAKE_CASE    | `PENDING`, `COMPLETED`        |

Note: The codebase uses British English spelling in some identifiers (`visualise`,
`analyse`, `sanitise`, `normalise`, `unauthorised`). Be consistent with the existing
file you're editing.

### Components

- 100% functional components (no class components)
- Mark interactive/stateful components with `"use client"` directive at the top
- Server components are the default — do not add `"use client"` unless necessary
- Define prop types as `type XProps = { ... }` immediately above the component
- Use shadcn/ui from `@/components/ui/`, `cn()` from `@/lib/utils`, Lucide for icons

### State Management

- No external state library — use `useState`/`useRef` for client state
- Use `useChat` from `@ai-sdk/react` for chat state; `next-themes` for theme

### Error Handling

- Always wrap risky operations in try/catch
- In catch blocks, report to Sentry with context tags:
  ```ts
  Sentry.captureException(error, { tags: { context: "descriptive_context" } });
  ```
- Client-side: also show `toast.error("User-friendly message")` from Sonner
- Server actions: throw `new Error("user-friendly message")` for expected errors
- API routes: return appropriate HTTP status codes (`NextResponse.json(...)`)
- AI tools: return `{ error: "error_code" }` objects (do not throw)
- No custom error classes — use plain `Error`

### Sentry Observability

- Import as `import * as Sentry from "@sentry/nextjs"` (no re-initialization needed)
- Wrap significant operations in `Sentry.startSpan()` with meaningful `op` and `name`
- Use `Sentry.logger` with `logger.fmt` template literals for structured logging
- Config: `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
  — already set up, do not duplicate init

### API Patterns

- Use Next.js route handlers with named HTTP method exports (`GET`, `POST`, `DELETE`)
- Use server actions (`"use server"`) for data mutations called from client components
- Every server action and API route must verify auth:
  ```ts
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) { /* return 401 or throw */ }
  ```
- Redis caching uses structured keys (e.g., `chat:messages:{chatId}`)

### Database (Prisma)

- Schema at `prisma/schema.prisma` — PostgreSQL on Neon serverless
- Singleton client in `src/lib/prisma.ts`
- Key models: User, Chat, Message, Part, IndexedRepository, Session, Account
- Run `npx prisma migrate dev --name <name>` to create migrations
- Run `npx prisma generate` after schema changes (also runs automatically in build)

### Comments

- Use JSDoc `/** */` with `@param`/`@returns` on exported functions
- Use inline `//` comments for step markers and brief explanations
- Do not leave large blocks of commented-out code


## Key Files

| File | Description |
|------|-------------|
| `src/ai/tools.ts` | AI tool definitions (weather, repos, code graph) |
| `src/ai/prompts.ts` | All AI system/user prompts as constants |
| `src/app/api/chat/route.ts` | Main chat API with streaming + Redis caching |
| `src/actions/ui-message-actions.ts` | Server actions for chats, messages, sharing |
| `src/actions/github-actions.ts` | GitHub API server actions (Octokit) |
| `src/types/ui-message-type.ts` | Core Zod schemas and derived types |
| `src/lib/vector.ts` | Upstash Vector client with hybrid search |
| `src/lib/ui-message-util.ts` | DB <-> UI message part mapping |
| `src/services/repo-indexer.ts` | Repo indexing (tarball + LangChain splitting) |
| `prisma/schema.prisma` | Database schema |
