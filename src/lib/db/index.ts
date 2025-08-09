import { drizzle } from 'drizzle-orm/libsql';

import * as schema from './schema';

const db = drizzle({
  connection: {
    url:
      process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:8080'
        : process.env.DATABASE_URL,
    authToken:
      process.env.NODE_ENV === 'development'
        ? undefined
        : process.env.DATABASE_TOKEN,
  },
  casing: 'snake_case',
  schema,
});

export default db;
