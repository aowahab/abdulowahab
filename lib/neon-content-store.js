import pg from 'pg';
import { normalizeContent } from './portfolio-content.js';

const TABLE = 'portfolio_site_documents';
let pool;

function db() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Neon connection is not configured');
  if (!pool) pool = new pg.Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });
  return pool;
}

async function ensureTable(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (
    document_key TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

// Returns null for a not-yet-migrated document; never silently substitutes defaults.
export async function readNeonContent() {
  const client = db();
  await ensureTable(client);
  const { rows } = await client.query(`SELECT content FROM ${TABLE} WHERE document_key = $1`, ['site/content.json']);
  return rows.length ? normalizeContent(rows[0].content) : null;
}

export async function writeNeonContent(content) {
  const client = db();
  await ensureTable(client);
  const normalized = normalizeContent(content);
  await client.query(
    `INSERT INTO ${TABLE} (document_key, content) VALUES ($1, $2::jsonb)
     ON CONFLICT (document_key) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
    ['site/content.json', JSON.stringify(normalized)]
  );
  return normalized;
}
