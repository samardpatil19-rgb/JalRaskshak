import db from './db.js';

// ── Haversine distance between two lat/lng pairs (meters) ──
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Determine which CCV sector a device is closest to ──
function detectSector(lat, lng) {
    try {
        const ccvs = db.prepare("SELECT id, lat, lng FROM devices WHERE type = 'ccv'").all();
        if (ccvs.length === 0) return null;

        let closest = null;
        let minDist = Infinity;
        for (const ccv of ccvs) {
            const dist = haversine(lat, lng, ccv.lat, ccv.lng);
            if (dist < minDist) {
                minDist = dist;
                closest = ccv.id;
            }
        }
        return closest;
    } catch {
        return null;
    }
}

// ── Speed in degrees per tick (2s tick) ──
// UAV: ~12 m/s → 24m per tick → ~0.00022 degrees
// UFV: ~4 m/s  → 8m per tick  → ~0.00007 degrees
const SPEED = { uav: 0.00025, ufv: 0.00008 };
const BATTERY_DRAIN = { uav: 0.3, ufv: 0.15 }; // % per tick

export function runSimulator(io) {
    console.log('  SITL Simulator Engine Started (Tick: 2000ms)');
    console.log('  Features: Waypoint Following · CCV Sector Detection · Battery Drain');

    io.on('connection', (socket) => {
        try {
            const devices = db.prepare('SELECT * FROM devices').all();
            socket.emit('fleet_update', devices);

            // Also send current active mission trails
            const trails = getActiveTrails();
            socket.emit('trails_update', trails);
        } catch (e) {
            console.error('  [Simulator] Connection init error:', e.message);
        }
    });

    setInterval(() => {
        try {
            tick(io);
        } catch (e) {
            console.error('  [Simulator] Tick error:', e.message);
        }
    }, 2000);
}

function getActiveTrails() {
    try {
        const activeMissions = db.prepare(`
            SELECT m.id, m.route_id, m.device_id, r.waypoints
            FROM missions m
            JOIN routes r ON m.route_id = r.id
            WHERE m.status = 'active'
        `).all();

        return activeMissions.map(m => ({
            device_id: m.device_id,
            waypoints: JSON.parse(m.waypoints)
        }));
    } catch {
        return [];
    }
}

function tick(io) {
    // Fetch all active missions with route waypoints
    const activeMissions = db.prepare(`
        SELECT 
            m.id as mission_id, 
            m.route_id, 
            m.device_id, 
            m.waypoint_index,
            d.lat, d.lng, d.battery, d.trash_collected, d.type,
            r.waypoints
        FROM missions m
        JOIN devices d ON m.device_id = d.id
        JOIN routes r ON m.route_id = r.id
        WHERE m.status = 'active'
    `).all();

    for (const mission of activeMissions) {
        const waypoints = JSON.parse(mission.waypoints);
        let wpIndex = mission.waypoint_index || 0;
        let { lat, lng, battery, trash_collected, type } = mission;

        // ── Battery drain ──
        const drain = BATTERY_DRAIN[type] || 0.2;
        battery = Math.max(0, battery - drain);

        // ── If battery is dead, end mission ──
        if (battery <= 0) {
            db.prepare("UPDATE missions SET status = 'completed', end_time = datetime('now') WHERE id = ?")
                .run(mission.mission_id);
            db.prepare("UPDATE devices SET status = 'idle', battery = 0, last_updated = datetime('now') WHERE id = ?")
                .run(mission.device_id);
            continue;
        }

        // ── Move towards current waypoint ──
        if (wpIndex < waypoints.length) {
            const target = waypoints[wpIndex];
            const targetLat = target[0];
            const targetLng = target[1];

            const dLat = targetLat - lat;
            const dLng = targetLng - lng;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);

            const speed = SPEED[type] || 0.00015;

            if (dist < speed * 1.5) {
                // Reached waypoint — snap to it and advance
                lat = targetLat;
                lng = targetLng;
                wpIndex += 1;

                // Trash collection at waypoints (UFV picks up trash, UAV detects)
                if (type === 'ufv' && Math.random() < 0.4) {
                    trash_collected += Math.floor(Math.random() * 3) + 1;
                } else if (type === 'uav' && Math.random() < 0.2) {
                    trash_collected += 1;
                }
            } else {
                // Move towards target at constant speed
                const ratio = speed / dist;
                lat += dLat * ratio;
                lng += dLng * ratio;
            }

            // Update waypoint index in mission
            db.prepare("UPDATE missions SET waypoint_index = ? WHERE id = ?")
                .run(wpIndex, mission.mission_id);
        }

        // ── Check if mission route is complete ──
        if (wpIndex >= waypoints.length) {
            db.prepare("UPDATE missions SET status = 'completed', end_time = datetime('now') WHERE id = ?")
                .run(mission.mission_id);
            db.prepare("UPDATE devices SET status = 'idle', lat = ?, lng = ?, battery = ?, trash_collected = ?, last_updated = datetime('now') WHERE id = ?")
                .run(lat, lng, battery, trash_collected, mission.device_id);
            continue;
        }

        // ── Detect which CCV sector we're in ──
        const sector = detectSector(lat, lng);

        // ── Update device position + state ──
        db.prepare("UPDATE devices SET lat = ?, lng = ?, battery = ?, trash_collected = ?, sector = ?, last_updated = datetime('now') WHERE id = ?")
            .run(lat, lng, battery, trash_collected, sector, mission.device_id);
    }

    // ── Broadcast fleet status ──
    const devices = db.prepare('SELECT * FROM devices').all();
    io.emit('fleet_update', devices);

    // ── Broadcast overview metrics ──
    const totalTrash = devices.reduce((sum, d) => sum + (d.trash_collected || 0), 0);
    const activeCount = db.prepare("SELECT count(*) as c FROM missions WHERE status = 'active'").get().c;
    const totalDevices = devices.length;
    const activeDevices = devices.filter(d => d.status === 'active').length;

    io.emit('metrics_update', {
        active_missions: activeCount,
        total_trash: totalTrash,
        total_devices: totalDevices,
        active_devices: activeDevices,
    });

    // ── Broadcast route trails for active missions ──
    const trails = getActiveTrails();
    io.emit('trails_update', trails);
}
