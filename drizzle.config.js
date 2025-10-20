import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/lib/db/migrations',
  schema: './src/lib/db/schema/index.ts',
  casing: 'snake_case',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_TOKEN,
  },
});
