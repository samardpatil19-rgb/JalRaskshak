import db from './db.js';

try {
    console.log('--- DEVICES ---');
    const devices = db.prepare('SELECT * FROM devices').all();
    console.log(JSON.stringify(devices, null, 2));

    console.log('\n--- MISSIONS ---');
    const missions = db.prepare('SELECT * FROM missions').all();
    console.log(JSON.stringify(missions, null, 2));

    console.log('\n--- ACTIVE COUNT ---');
    const row = db.prepare("SELECT count(*) as c FROM missions WHERE status = 'active'").get();
    console.log('Active:', row.c);

    console.log('\n--- SIMULATOR JOIN QUERY ---');
    const active = db.prepare(`
        SELECT m.id, m.route_id, m.device_id, d.lat, d.lng, d.battery, d.trash_collected, d.type 
        FROM missions m 
        JOIN devices d ON m.device_id = d.id 
        WHERE m.status = 'active'
    `).all();
    console.log(JSON.stringify(active, null, 2));

    console.log('\nAll queries passed!');
} catch (e) {
    console.error('FULL ERROR:', e);
}
