import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('Connecting to PostgreSQL...');

const client = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

const db = drizzle(client, { schema });

console.log('Pushing schema to database...');

// Use drizzle-kit push instead
import { execSync } from 'child_process';

try {
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('✅ Schema pushed successfully');
} catch (error) {
  console.error('❌ Failed to push schema:', error.message);
  process.exit(1);
} finally {
  await client.end();
}
