import db from './db.js';

console.log('Resetting database...\n');

// Drop old tables (order matters for foreign keys)
db.exec('DROP TABLE IF EXISTS missions');
db.exec('DROP TABLE IF EXISTS devices');
db.exec('DROP TABLE IF EXISTS routes');
db.exec('DROP TABLE IF EXISTS alerts');
db.exec('DROP TABLE IF EXISTS complaints');
db.exec('DROP TABLE IF EXISTS sensor_readings');
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

  CREATE TABLE sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ccv_id TEXT NOT NULL,
    temp REAL,
    ph REAL,
    tds REAL,
    do_val REAL,
    bod REAL,
    turbidity REAL,
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX idx_sensor_ccv ON sensor_readings(ccv_id);
  CREATE INDEX idx_sensor_time ON sensor_readings(timestamp);

  CREATE TABLE routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    device_type TEXT NOT NULL,
    name TEXT NOT NULL,
    waypoints TEXT NOT NULL,
    params TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    lat REAL,
    lng REAL,
    description TEXT,
    ticket_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'warning',
    message TEXT NOT NULL,
    lat REAL,
    lng REAL,
    resolved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('uav', 'ufv', 'ccv')),
    status TEXT DEFAULT 'idle',
    battery REAL DEFAULT 100,
    trash_collected INTEGER DEFAULT 0,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    sector TEXT,
    last_updated TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT REFERENCES devices(id),
    route_id INTEGER REFERENCES routes(id),
    status TEXT DEFAULT 'active',
    waypoint_index INTEGER DEFAULT 0,
    start_time TEXT DEFAULT (datetime('now')),
    end_time TEXT
  );

  CREATE TABLE detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT REFERENCES devices(id),
    label TEXT NOT NULL,
    confidence REAL,
    lat REAL,
    lng REAL,
    bbox TEXT,
    image_path TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
  );
`);
console.log('  ✓ Recreated all tables with updated schema');
console.log('\nDone! Now run: node server/seed.js\n');
