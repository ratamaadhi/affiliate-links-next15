# Affiliate Links Management System

A full-stack application for managing affiliate links, built with Next.js 15, Turso database, and Better Auth authentication.

## Environment Setup

This project uses environment variables for configuration across different environments.

### Quick Setup

1. **Copy the example file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values:**
   - Open `.env.local` and replace placeholder values with your actual credentials
   - For development, you can also copy `.env.development` to `.env.local`

3. **Required Services:**
   - **Turso Database**: Get token and URL from [Turso Dashboard](https://turso.tech/)
   - **Upstash Redis**: Get URL from [Upstash Dashboard](https://upstash.com/)
   - **Resend Email**: Get API key from [Resend Dashboard](https://resend.com/)
   - **Google OAuth**: Create credentials in [Google Cloud Console](https://console.cloud.google.com/)

### Environment Files

- `.env.example` - Template with all required variables
- `.env.development` - Development-specific configuration
- `.env.production` - Production-specific configuration
- `.env.local` - Local overrides (not committed to git)

## Getting Started

1. **Install dependencies:**

   ```bash
   yarn install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Run database migrations:**

   ```bash
   yarn db:migrate
   ```

4. **Start the development server:**
   ```bash
   yarn dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn test` - Run tests
- `yarn db:generate` - Generate database migrations
- `yarn db:migrate` - Run database migrations
- `yarn db:studio` - Open Drizzle Studio

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15
- **Database**: [Turso](https://turso.tech/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [BETTER-AUTH](https://www.better-auth.com/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) with [Tailwind CSS](https://tailwindcss.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/)
- **Data Fetching**: [SWR](https://swr.vercel.app/)
- **Testing**: [Jest](https://jestjs.io/) with [React Testing Library](https://testing-library.com/)
- **Email**: [Resend](https://resend.com/)
- **Caching**: [Redis](https://redis.io/) via Upstash

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Set environment variables in Vercel Dashboard under Project Settings → Environment Variables.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
