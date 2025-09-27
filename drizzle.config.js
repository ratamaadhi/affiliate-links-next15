import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/lib/db/migrations',
  schema: './src/lib/db/schema/index.ts',
  casing: 'snake_case',
  dialect: 'turso',
  dbCredentials: {
    url:
      process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:8080'
        : process.env.DATABASE_URL,
    authToken: process.env.DATABASE_TOKEN,
  },
});
