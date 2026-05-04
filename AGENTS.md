# AGENT GUIDELINES

This document provides critical context for agentic coding in this repository. Every line answers: "Would an agent likely miss this without help?"

## Essential Commands

```bash
# Development
yarn dev              # Start dev server (turbopack enabled)
yarn dev:local        # Start with local Turso database concurrently
yarn build            # Build for production
yarn start            # Start production server

# Database (EDIT SCHEMA IN src/lib/db/schema/, NOT migrations)
yarn db:generate      # Generate migrations from schema
yarn db:migrate       # Apply migrations to database
yarn db:studio        # Open Drizzle Studio

# Code Quality (runs on pre-commit hook)
yarn lint --fix       # Fix linting issues
yarn prettier         # Format code
yarn test             # Run all Jest tests
jest __test__/filename.test.js  # Run single test (note .js extension)

# E2E Testing
npx playwright test   # Run Playwright tests (auto-starts dev server)
```

## Critical Architecture Facts

### Database (Turso + Drizzle ORM)

- **Schema location**: Always edit files in `src/lib/db/schema/*.ts` — never edit auto-generated `migrations/schema.ts`
- **Fractional indexing**: Links use `displayOrder: real` type (not integer) for drag-and-drop reordering without full list reordering
- **Drizzle config**: Migrations output to `src/lib/db/migrations`, uses `snake_case` casing
- **Relationships**: `user` → `page` → `link` (one-to-many), cascade deletes enabled

### Authentication (Better Auth — NOT NextAuth.js)

- Configured in `src/lib/auth.ts` with Drizzle adapter
- Email/password + Google OAuth
- Session checks via `auth.api.getSession()`
- Email verification required in production (via Resend)
- Username management via Better Auth's username plugin

### Data Fetching (SWR)

- Custom hooks in `src/hooks/queries.ts` wrap SWR
- Use `useSWRInfinite` for paginated data (links, pages)
- Revalidate via `mutate()` after mutations
- Key format: `/api/resource` for API routes

### Form Patterns

- All forms use React Hook Form + Zod validation
- Submit via server actions or API routes
- Handle errors with sonner toasts
- Example patterns in `src/components/form/` and `src/components/page/create-page-form.tsx`

## Testing Quirks

### Jest Tests

- **Location**: `__test__/` directory (not `src/`)
- **Command**: Run single tests with `.js` extension: `jest __test__/filename.test.js` (even for TypeScript files)
- **Mock patterns**: Heavy mocking of hooks (`useAuth`, `useLinkInfinite`, `useUpdateLinkOrder`)
- **Async**: Use `waitFor` for async operations, not `act()`
- **Config**: `transformIgnorePatterns` excludes specific node_modules (nanostores, better-auth, dnd-kit, etc.)

### E2E Tests (Playwright)

- **Location**: `e2e/` directory
- **Dev server**: Auto-starts via `webServer` config in `playwright.config.ts`
- **Multi-browser**: Tests run on Chromium, Firefox, WebKit, and mobile devices

## Git Hooks

- **Pre-commit**: `yarn lint --fix && yarn test` (auto-fixes linting, runs all tests)
- **Pre-push**: `yarn build` (must build successfully before pushing)

## Development Workflow

- **Turbopack**: Enabled by default in `yarn dev` (faster dev server)
- **Local database**: Use `yarn dev:local` to run local Turso DB concurrently
- **MinIO**: Docker Compose provides local S3-compatible storage for image uploads
- **Bundle analysis**: Run `ANALYZE=true yarn build` for bundle size analysis

## Environment & Services

### Required Services

- **Turso Database**: `DATABASE_URL` + `DATABASE_TOKEN`
- **Upstash Redis**: `REDIS_URL` (optional, for caching)
- **Resend Email**: `RESEND_API_KEY` (for auth emails)
- **Google OAuth**: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

### Environment Files

- `.env.example` - Template
- `.env.local` - Local overrides (not committed)
- `.env.development` - Dev config
- `.env.production` - Production config

### S3 Configuration (Image Uploads)

Supports multiple S3-compatible providers via `NEXT_PUBLIC_S3_*` variables:

- AWS S3
- DigitalOcean Spaces
- Cloudflare R2
- MinIO (local, via Docker Compose)

## Code Style & Conventions

- **Imports**: Use absolute imports with `@/` prefix: `import { Button } from '@/components/ui/button'`
- **Formatting**: Prettier config: single quotes, trailing commas, 2-space tabs
- **Types**: TypeScript with `strict: false`, path aliases via `@/*`
- **Naming**: Components (PascalCase), variables/functions (camelCase)
- **UI Components**: shadcn/ui (new-york style) + Radix UI + Tailwind CSS 4

## Specialized Subagents

This repo uses OpenCode subagents (configured in `opencode.json`):

- **SA-BE**: Backend/API/database tasks (Drizzle, Turso)
- **SA-FE**: Frontend tasks (Next.js, Tailwind, React)
- **SA-QA**: Testing tasks (Jest, Playwright)
- **SA-UX**: Design and UI specifications (read-only)

Dispatch appropriate subagent for specialized work.

## Common Gotchas

1. **Fractional indexing**: Never use integer positions for links — always calculate midpoints between existing `displayOrder` values
2. **Schema edits**: Edit schema files, not migrations. Generate new migrations after schema changes.
3. **Test file extension**: Jest test files referenced on command line use `.js` extension even if written in TypeScript
4. **Better Auth**: Not NextAuth.js — different API patterns (`auth.api.getSession()` not `getSession()`)
5. **Image uploads**: S3 endpoint must be configured in `next.config.mjs` for image optimization
6. **Session middleware**: Protected routes use middleware in `src/middleware.ts` or session checks via `auth.api`
7. **SWR revalidation**: Always call `mutate()` after data mutations to refresh UI
