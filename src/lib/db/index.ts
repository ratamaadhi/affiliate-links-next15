import { drizzle } from 'drizzle-orm/libsql';

import * as schema from './schema';

const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_TOKEN,
  },
  casing: 'snake_case',
  schema,
});

export default db;
