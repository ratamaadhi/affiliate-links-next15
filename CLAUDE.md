# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development
yarn dev              # Start dev server (turbopack)
yarn dev:local        # Start with local Turso database
yarn build            # Build for production
yarn start            # Start production server

# Code Quality
yarn lint             # Run ESLint
yarn prettier         # Format code
yarn test             # Run all tests
jest __test__/filename.test.js  # Run single test

# Database
yarn db:generate      # Generate migrations from schema
yarn db:migrate       # Apply migrations to database
yarn db:studio        # Open Drizzle Studio
```

## Architecture Overview

### Tech Stack

- **Next.js 15** with App Router (not Pages Router)
- **Turso** (SQLite) + **Drizzle ORM**
- **Better Auth** for authentication (not NextAuth)
- **shadcn/ui** + Radix UI + Tailwind CSS
- **React Hook Form** + **Zod** for forms
- **SWR** for data fetching

### Directory Structure

```
src/
├── app/
│   ├── (admin)/      # Admin dashboard (protected)
│   ├── (auth)/       # Auth routes (login, signup)
│   ├── [username]/   # Public user pages (dynamic routes)
│   └── api/          # API routes
├── components/       # Reusable components
├── lib/
│   ├── auth.ts       # Better Auth config
│   └── db/           # Database schema + connection
├── server/           # Server actions
└── hooks/            # Custom SWR hooks
```

## Authentication Architecture

**Better Auth** is configured in `src/lib/auth.ts`:

- Uses Drizzle adapter
- Email/password + Google OAuth
- Username management via Better Auth's username plugin
- Email verification via Resend
- Sessions stored in database

Protected routes use middleware or session checks via `auth.api`.

## Database Schema

**Important**: When modifying schema, always edit files in `src/lib/db/schema/`, NOT `src/lib/db/migrations/schema.ts` (which is auto-generated).

Core relationships:

- `user` → `page` (one-to-many)
- `page` → `link` (one-to-many)
- `page` → `short_link` (one-to-many)
- `user` → `username_history` (one-to-many)

Key features:

- Fractional indexing for link ordering (`display_order` field uses `real` type)
- JSON column for page theme settings
- Cascade deletes on foreign keys

## Form Patterns

All forms follow this pattern:

1. Define Zod schema for validation
2. Use React Hook Form with Zod resolver
3. Submit via server action or API route
4. Handle loading/error states with sonner toasts

Example forms: `src/components/form/signup-form-fields.tsx`, `src/components/page/create-page-form.tsx`

## Data Fetching with SWR

Custom hooks in `src/hooks/queries.ts` wrap SWR for consistent data fetching:

- Use `useSWR` for standard queries
- Use `useSWRInfinite` for paginated data
- Key format: `/api/resource` for API routes
- Revalidate via `mutate()` after mutations

## Link Ordering System

Links use **fractional indexing** (not integer positions) for drag-and-drop reordering:

- `display_order` is a `real` type, not integer
- Allows inserting between items without reordering entire list
- See `src/components/link/list-links.tsx` for DnD Kit implementation

## API Route Patterns

- Auth routes: `/api/auth/[...all]` (handled by Better Auth)
- RESTful CRUD in `/api/` with proper HTTP methods
- Session checks via `auth.api.getSession()`
- Return JSON responses with consistent error handling

## Import Conventions

Use absolute imports with `@/` prefix:

```typescript
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
```

## Code Style

- Single quotes, trailing commas, 2-space indentation (Prettier)
- PascalCase for components, camelCase for variables/functions
- TypeScript with path aliases via `@/*`

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

- `DATABASE_URL` + `DATABASE_TOKEN` (Turso)
- `UPSTASH_REDIS_REST_URL` (optional, for caching)
- `RESEND_API_KEY` (for emails)
- Google OAuth credentials

## Testing

Tests in `__test__/` use Jest + React Testing Library:

- Run `yarn test` for all tests
- Individual test files: `jest __test__/filename.test.js`
- `role="link"` for interactive elements (not buttons)
- Use `waitFor` for async operations
