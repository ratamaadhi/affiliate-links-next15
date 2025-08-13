import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/lib/db/migrations',
  schema: './src/lib/db/schema/index.ts',
  casing: 'snake_case',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'http://127.0.0.1:8080',
    authToken: process.env.DATABASE_TOKEN,
  },
});
