import bcrypt from 'bcryptjs';
import db from './db.js';

console.log('Seeding Jal Rakshak database...\n');

// ─── Admin User ──────────────────────────────────────────
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@jalrakshak.in');
if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@jalrakshak.in', hash, 'admin');
    console.log('  ✓ Admin user created (admin@jalrakshak.in / admin123)');
} else {
    console.log('  – Admin user already exists');
}

// ─── Sensor Readings (historical mock data) ──────────────
const sensorCount = db.prepare('SELECT COUNT(*) as c FROM sensor_readings').get().c;
if (sensorCount === 0) {
    const ccvIds = ['CCV-01', 'CCV-02', 'CCV-03'];
    const insertSensor = db.prepare(
        'INSERT INTO sensor_readings (ccv_id, temp, ph, tds, do_val, bod, turbidity, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const seedSensors = db.transaction(() => {
        for (const ccv of ccvIds) {
            for (let i = 96; i >= 0; i--) {
                const date = new Date(Date.now() - i * 30 * 60 * 1000);
                const ts = date.toISOString().replace('T', ' ').substring(0, 19);

                const temp = 24 + Math.random() * 8 - 2;
                const ph = 7.0 + Math.random() * 1.4 - 0.5;
                const tds = 280 + Math.random() * 180;
                const do_val = 5.5 + Math.random() * 3;
                const bod = 3 + Math.random() * 4;
                const turbidity = 10 + Math.random() * 20;

                insertSensor.run(
                    ccv,
                    Math.round(temp * 10) / 10,
                    Math.round(ph * 100) / 100,
                    Math.round(tds),
                    Math.round(do_val * 10) / 10,
                    Math.round(bod * 10) / 10,
                    Math.round(turbidity * 10) / 10,
                    ts
                );
            }
        }
    });

    seedSensors();
    console.log(`  ✓ Seeded ${ccvIds.length * 97} sensor readings (48h history × 3 CCVs)`);
} else {
    console.log(`  – Sensor readings already exist (${sensorCount} rows)`);
}

// ─── Alerts ──────────────────────────────────────────────
const alertCount = db.prepare('SELECT COUNT(*) as c FROM alerts').get().c;
if (alertCount === 0) {
    const insertAlert = db.prepare(
        'INSERT INTO alerts (type, severity, message, lat, lng, resolved) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const seedAlerts = db.transaction(() => {
        insertAlert.run('drowning', 'critical', 'Possible drowning detected — Person in distress near Sector Alpha', 23.037, 72.573, 0);
        insertAlert.run('flood', 'warning', 'Water level rising above threshold in Sector Beta — 1.8m above normal', 23.032, 72.580, 0);
        insertAlert.run('drowning', 'resolved', 'Drowning alert near bridge — Verified false alarm (swimmer)', 23.029, 72.585, 1);
        insertAlert.run('flood', 'critical', 'Flash flood risk — Heavy rainfall upstream detected', 23.040, 72.570, 0);
        insertAlert.run('drowning', 'warning', 'Unidentified object in water — UAV dispatched for verification', 23.035, 72.577, 0);
    });

    seedAlerts();
    console.log('  ✓ Seeded 5 alerts');
} else {
    console.log(`  – Alerts already exist (${alertCount} rows)`);
}

// ─── Sample Routes ───────────────────────────────────────
const routeCount = db.prepare('SELECT COUNT(*) as c FROM routes').get().c;
if (routeCount === 0) {
    const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@jalrakshak.in');
    if (adminUser) {
        const insertRoute = db.prepare(
            'INSERT INTO routes (user_id, device_type, name, waypoints, params) VALUES (?, ?, ?, ?, ?)'
        );

        insertRoute.run(adminUser.id, 'uav', 'Sector Alpha Patrol',
            JSON.stringify([[23.037, 72.573], [23.035, 72.575], [23.033, 72.578], [23.037, 72.573]]),
            JSON.stringify({ altitude: 45, speed: 12, payload: 0.5 })
        );
        insertRoute.run(adminUser.id, 'ufv', 'River Bend Cleanup',
            JSON.stringify([[23.032, 72.580], [23.030, 72.583], [23.028, 72.586]]),
            JSON.stringify({ speed: 4, payload: 15 })
        );

        console.log('  ✓ Seeded 2 sample routes');
    }
} else {
    console.log(`  – Routes already exist (${routeCount} rows)`);
}

// ─── Devices ─────────────────────────────────────────────
const deviceCount = db.prepare('SELECT COUNT(*) as c FROM devices').get().c;
if (deviceCount === 0) {
    const insertDevice = db.prepare(
        'INSERT INTO devices (id, type, lat, lng, status) VALUES (?, ?, ?, ?, ?)'
    );
    const seedDevices = db.transaction(() => {
        // UAVs
        insertDevice.run('UAV-01', 'uav', 23.037, 72.573, 'idle');
        insertDevice.run('UAV-02', 'uav', 23.040, 72.570, 'idle');
        // UFVs
        insertDevice.run('UFV-01', 'ufv', 23.032, 72.580, 'idle');
        insertDevice.run('UFV-02', 'ufv', 23.029, 72.585, 'idle');
        // CCVs (Command & Control Vehicles — act as sector base stations)
        insertDevice.run('CCV-01', 'ccv', 23.0225, 72.5714, 'active');
        insertDevice.run('CCV-02', 'ccv', 23.0350, 72.5800, 'active');
        insertDevice.run('CCV-03', 'ccv', 23.0480, 72.5900, 'active');
    });
    seedDevices();
    console.log('  ✓ Seeded 7 devices (2 UAV, 2 UFV, 3 CCV)');
} else {
    console.log(`  – Devices already exist (${deviceCount} rows)`);
}

console.log('\n  Database seeded successfully!\n');

