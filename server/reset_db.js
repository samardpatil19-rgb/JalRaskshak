import db from './db.js';

console.log('Resetting database...\n');

// Drop old tables
db.exec('DROP TABLE IF EXISTS routes');
db.exec('DROP TABLE IF EXISTS users');
console.log('  ✓ Dropped old tables');

// Recreate with new schema
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'operator',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    device_type TEXT NOT NULL,
    name TEXT NOT NULL,
    waypoints TEXT NOT NULL,
    params TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);
console.log('  ✓ Recreated tables with email schema');
console.log('\nDone! Now run: node server/seed.js\n');
