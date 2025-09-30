# AGENT GUIDELINES

This document outlines the conventions and commands for agentic coding in this repository.

## Project Overview

This project is a full-stack application for managing affiliate links, built with Next.js 15. It allows users to create pages, add links, and manage them through a user-friendly and responsive dashboard.

### Key Technologies

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Turso](https://turso.tech/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [BETTER-AUTH](https://www.better-auth.com/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) with [Tailwind CSS](https://tailwindcss.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
- **Data Fetching**: [SWR](https://swr.vercel.app/)
- **Testing**: [Jest](https://jestjs.io/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Email**: [Resend](https://resend.com/)
- **Caching**: [Redis](https://redis.io/) (via `ioredis`)

## Build/Lint/Test Commands

- **Install**: `yarn install`
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **Format**: `yarn prettier`
- **Test all**: `yarn test`
- **Single test**: `jest __test__/filename.test.js`
- **DB commands**: `yarn db:generate`, `yarn db:migrate`, `yarn db:studio`

## Code Style Guidelines

- **Imports**: Use absolute imports: `import { Button } from "@/components/ui/button"`
- **Formatting**: Prettier config: single quotes, trailing commas, 2-space tabs
- **Types**: TypeScript with strict mode disabled, path aliases via `@/*`
- **Naming**: Components (PascalCase), variables/functions (camelCase)
- **Error Handling**: Use try-catch with user-friendly messages

## Agent Guidelines

- **Conventions**: Analyze existing code patterns before making changes
- **Libraries**: Verify library usage in project before employing
- **Style**: Mimic existing formatting, naming, and architectural patterns
- **Verification**: Run `yarn lint` and `yarn test` after code changes
- **Safety**: Explain commands before modifying file system
