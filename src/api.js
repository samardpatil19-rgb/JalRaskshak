const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

function getToken() {
    return localStorage.getItem('jal_token');
}

async function request(path, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return data;
}

export const api = {
    // Auth
    login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    me: () => request('/auth/me'),

    // Sensors
    getSensorReadings: (ccvId, params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/sensors/${ccvId}${qs ? '?' + qs : ''}`);
    },
    getLatestSensor: (ccvId) => request(`/sensors/${ccvId}/latest`),
    postSensorReading: (data) => request('/sensors', { method: 'POST', body: JSON.stringify(data) }),

    // Routes
    getRoutes: () => request('/routes'),
    getRoute: (id) => request(`/routes/${id}`),
    saveRoute: (data) => request('/routes', { method: 'POST', body: JSON.stringify(data) }),
    deleteRoute: (id) => request(`/routes/${id}`, { method: 'DELETE' }),

    // Complaints
    submitComplaint: (data) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
    getComplaints: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/complaints${qs ? '?' + qs : ''}`);
    },
    lookupComplaint: (ticketId) => request(`/complaints/${ticketId}`),

    // Alerts
    getAlerts: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/alerts${qs ? '?' + qs : ''}`);
    },
    resolveAlert: (id) => request(`/alerts/${id}/resolve`, { method: 'PATCH' }),

    // Health
    health: () => request('/health'),
};
