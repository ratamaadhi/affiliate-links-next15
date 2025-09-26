# AGENT GUIDELINES

This document outlines the conventions and commands for agentic coding in this repository.

## Project Overview

This project is a full-stack application for managing affiliate links, built with Next.js 15. It allows users to create pages, add links, and manage them through a user-friendly and responsive dashboard.

### Key Technologies

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Turso](https://turso.tech/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (likely via `better-auth`)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) with [Tailwind CSS](https://tailwindcss.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
- **Data Fetching**: [SWR](https://swr.vercel.app/)
- **Testing**: [Jest](https://jestjs.io/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Email**: [Resend](https://resend.com/)
- **Caching**: [Redis](https://redis.io/) (via `ioredis`)

## Build/Lint/Test Commands

- **Install Dependencies**: `yarn install`
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **Format**: `yarn prettier`
- **Run all tests**: `yarn test`
- **Run a single test**: `jest <path-to-test-file>` (e.g., `jest __test__/login-form.test.js`)

## Code Style Guidelines

- **Imports**: Use absolute imports where possible, e.g., `import { Button } from "@/components/ui/button";`
- **Formatting**: Adhere to Prettier formatting. Run `yarn prettier` to format code.
- **Types**: Use TypeScript for type safety.
- **Naming Conventions**:
  - Components: PascalCase (e.g., `LoginForm`)
  - variables/functions: camelCase (e.g., `handleSubmit`)
- **Error Handling**: Implement robust error handling using `try-catch` blocks and display user-friendly messages.

## Agent Operational Guidelines

This section outlines the core principles for AI agents operating within this repository.

- **Adherence to Conventions**: Rigorously adhere to existing project conventions. Analyze surrounding code, tests, and configuration before making changes.
- **Library and Framework Usage**: Do not assume a library or framework is available. Verify its established usage within the project before employing it.
- **Style and Structure Mimicry**: Mimic the style (formatting, naming), structure, framework choices, and architectural patterns of existing code.
- **Idiomatic Changes**: Ensure changes integrate naturally and idiomatically with the local context.
- **Verification**: After making code changes, execute project-specific build, linting, and testing commands to ensure code quality and adherence to standards.
- **Safety**: Before executing commands that modify the file system or codebase, provide a brief explanation of the command's purpose and potential impact.
