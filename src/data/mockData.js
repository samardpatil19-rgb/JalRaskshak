// ── Device Fleet ──────────────────────────────────────────────
export const sectors = [
    { id: 'S1', name: 'Sector Alpha', center: [23.0225, 72.5714], radius: 1500 },
    { id: 'S2', name: 'Sector Bravo', center: [23.0350, 72.5800], radius: 1500 },
    { id: 'S3', name: 'Sector Charlie', center: [23.0480, 72.5900], radius: 1500 },
];

export const uavs = [
    { id: 'UAV-01', sector: 'S1', lat: 23.0230, lng: 72.5720, battery: 87, status: 'patrolling', speed: 12, altitude: 45, payloadKg: 0.5 },
    { id: 'UAV-02', sector: 'S2', lat: 23.0355, lng: 72.5810, battery: 62, status: 'returning', speed: 8, altitude: 30, payloadKg: 0 },
    { id: 'UAV-03', sector: 'S3', lat: 23.0490, lng: 72.5905, battery: 34, status: 'charging', speed: 0, altitude: 0, payloadKg: 0 },
];

export const ufvs = [
    { id: 'UFV-01', sector: 'S1', lat: 23.0210, lng: 72.5700, battery: 91, status: 'collecting', speed: 3, garbageBinPercent: 45 },
    { id: 'UFV-02', sector: 'S1', lat: 23.0240, lng: 72.5730, battery: 55, status: 'en-route', speed: 5, garbageBinPercent: 20 },
    { id: 'UFV-03', sector: 'S2', lat: 23.0340, lng: 72.5790, battery: 78, status: 'collecting', speed: 2, garbageBinPercent: 72 },
    { id: 'UFV-04', sector: 'S2', lat: 23.0360, lng: 72.5820, battery: 23, status: 'returning', speed: 4, garbageBinPercent: 95 },
    { id: 'UFV-05', sector: 'S3', lat: 23.0475, lng: 72.5895, battery: 100, status: 'idle', speed: 0, garbageBinPercent: 0 },
    { id: 'UFV-06', sector: 'S3', lat: 23.0500, lng: 72.5920, battery: 68, status: 'collecting', speed: 3, garbageBinPercent: 58 },
];

export const ccvs = [
    { id: 'CCV-01', sector: 'S1', lat: 23.0225, lng: 72.5714, status: 'active' },
    { id: 'CCV-02', sector: 'S2', lat: 23.0350, lng: 72.5800, status: 'active' },
    { id: 'CCV-03', sector: 'S3', lat: 23.0480, lng: 72.5900, status: 'maintenance' },
];

// ── Sensor Data ──────────────────────────────────────────────
export const sensorReadings = {
    'CCV-01': { temp: 27.3, bod: 4.2, tds: 310, ph: 7.1, do_val: 6.8, turbidity: 18 },
    'CCV-02': { temp: 28.1, bod: 5.8, tds: 420, ph: 6.8, do_val: 5.2, turbidity: 34 },
    'CCV-03': { temp: 26.9, bod: 3.1, tds: 280, ph: 7.4, do_val: 7.5, turbidity: 12 },
};

export const sensorHistory = [
    { time: '06:00', temp: 25.1, ph: 7.0, tds: 300, turbidity: 15, do_val: 7.1, bod: 3.8 },
    { time: '08:00', temp: 26.0, ph: 7.1, tds: 310, turbidity: 17, do_val: 6.9, bod: 4.0 },
    { time: '10:00', temp: 27.3, ph: 7.2, tds: 320, turbidity: 20, do_val: 6.5, bod: 4.3 },
    { time: '12:00', temp: 28.5, ph: 6.9, tds: 350, turbidity: 28, do_val: 5.8, bod: 5.1 },
    { time: '14:00', temp: 29.1, ph: 6.8, tds: 380, turbidity: 32, do_val: 5.3, bod: 5.6 },
    { time: '16:00', temp: 28.8, ph: 6.9, tds: 370, turbidity: 30, do_val: 5.5, bod: 5.3 },
    { time: '18:00', temp: 27.5, ph: 7.0, tds: 340, turbidity: 24, do_val: 6.2, bod: 4.7 },
    { time: '20:00', temp: 26.2, ph: 7.1, tds: 315, turbidity: 19, do_val: 6.7, bod: 4.1 },
];

// ── Garbage Stats ────────────────────────────────────────────
export const garbageStats = {
    totalCollectedKg: 12840,
    recycledKg: 8950,
    organicKg: 2130,
    plasticKg: 6420,
    debrisKg: 4290,
    todayKg: 185,
    weeklyKg: [120, 145, 180, 160, 195, 210, 185],
    weekLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

// ── Alerts ───────────────────────────────────────────────────
export const alerts = [
    { id: 'A1', type: 'drowning', lat: 23.0260, lng: 72.5740, severity: 'critical', time: '14:32', message: 'Potential drowning detected in Sector Alpha', resolved: false },
    { id: 'A2', type: 'flood', lat: 23.0370, lng: 72.5830, severity: 'warning', time: '12:15', message: 'Water level rising in Sector Bravo — 1.2m above normal', resolved: false },
    { id: 'A3', type: 'drowning', lat: 23.0490, lng: 72.5910, severity: 'resolved', time: '09:45', message: 'False alarm cleared — swimmer verified safe', resolved: true },
    { id: 'A4', type: 'flood', lat: 23.0230, lng: 72.5700, severity: 'info', time: '08:00', message: 'Seasonal water level increase detected — monitoring', resolved: false },
];

export const emergencyContacts = [
    { name: 'District Flood Control', phone: '+91 79 2562 1234', role: 'Flood Authority' },
    { name: 'River Police Station', phone: '+91 79 2553 5678', role: 'Law Enforcement' },
    { name: 'Municipal Water Dept.', phone: '+91 79 2540 9012', role: 'Water Authority' },
    { name: 'Emergency Services', phone: '112', role: 'General Emergency' },
    { name: 'NDRF Helpline', phone: '011-24363260', role: 'Disaster Response' },
];

// ── Community & Events ───────────────────────────────────────
export const communityEvents = [
    { id: 'E1', title: 'Riverbank Cleanup Drive', date: '2026-02-22', location: 'Sector Alpha — East Bank', volunteers: 45, description: 'Join us for a community cleanup along the eastern riverbank. Gloves and supplies provided.' },
    { id: 'E2', title: 'Water Quality Awareness Workshop', date: '2026-03-05', location: 'Community Hall — Sector Bravo', volunteers: 30, description: 'Learn about river pollution indicators and how our sensor network monitors water health.' },
    { id: 'E3', title: 'Biodiversity Census Walk', date: '2026-03-15', location: 'Sector Charlie — Wetlands', volunteers: 20, description: 'Help document the flora and fauna along the riverbank for our biodiversity database.' },
];

export const biodiversityData = [
    { species: 'Kingfisher', category: 'Bird', count: 34, trend: 'increasing', habitat: 'Riverbank' },
    { species: 'Freshwater Turtle', category: 'Reptile', count: 12, trend: 'stable', habitat: 'Shallow waters' },
    { species: 'Lotus', category: 'Flora', count: 200, trend: 'increasing', habitat: 'Still water pockets' },
    { species: 'River Otter', category: 'Mammal', count: 6, trend: 'decreasing', habitat: 'Dense bank vegetation' },
    { species: 'Catfish', category: 'Fish', count: 85, trend: 'stable', habitat: 'Deep river channels' },
    { species: 'Egret', category: 'Bird', count: 48, trend: 'increasing', habitat: 'Mudflats' },
];

// ── AI Vision Verification ───────────────────────────────────
export const aiDetections = [
    { id: 'D1', droneId: 'UAV-01', timestamp: '14:22:15', lat: 23.0235, lng: 72.5725, droneLabel: 'Plastic Cluster', droneConfidence: 0.92, commandLabel: 'Plastic Cluster', commandConfidence: 0.89, match: true, imageUrl: null },
    { id: 'D2', droneId: 'UAV-01', timestamp: '14:25:40', lat: 23.0242, lng: 72.5718, droneLabel: 'Organic Debris', droneConfidence: 0.85, commandLabel: 'Organic Debris', commandConfidence: 0.87, match: true, imageUrl: null },
    { id: 'D3', droneId: 'UAV-02', timestamp: '13:58:02', lat: 23.0358, lng: 72.5815, droneLabel: 'Plastic Bottle', droneConfidence: 0.78, commandLabel: 'Floating Log', commandConfidence: 0.81, match: false, imageUrl: null },
    { id: 'D4', droneId: 'UAV-01', timestamp: '14:30:55', lat: 23.0228, lng: 72.5732, droneLabel: 'Large Debris', droneConfidence: 0.95, commandLabel: 'Large Debris', commandConfidence: 0.93, match: true, imageUrl: null },
    { id: 'D5', droneId: 'UAV-02', timestamp: '13:45:18', lat: 23.0345, lng: 72.5805, droneLabel: 'Trash Cluster', droneConfidence: 0.88, commandLabel: 'Vegetation Mat', commandConfidence: 0.72, match: false, imageUrl: null },
    { id: 'D6', droneId: 'UAV-03', timestamp: '11:12:30', lat: 23.0492, lng: 72.5908, droneLabel: 'Plastic Bag', droneConfidence: 0.91, commandLabel: 'Plastic Bag', commandConfidence: 0.90, match: true, imageUrl: null },
];

// ── Founders ─────────────────────────────────────────────────
export const founders = [
    { name: 'Samar Patil', role: 'Co-Founder', bio: 'Visionary leader driving the integration of AI and robotics for environmental restoration.', avatar: null },
    { name: 'Aaryan Patil', role: 'Co-Founder', bio: 'Systems architect focused on autonomous navigation and drone coordination systems.', avatar: null },
    { name: 'Akhilesh Kulkarni', role: 'Co-Founder', bio: 'Hardware specialist designing the UFV conveyor systems and CCV sensor arrays.', avatar: null },
    { name: 'Vinay Shedge', role: 'Co-Founder', bio: 'AI/ML engineer developing computer vision models for waste detection and classification.', avatar: null },
];
