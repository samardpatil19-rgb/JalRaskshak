import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [fleet, setFleet] = useState([]);
    const [metrics, setMetrics] = useState({ active_missions: 0, total_trash: 0, total_devices: 0, active_devices: 0 });
    const [trails, setTrails] = useState([]);
    const [detections, setDetections] = useState([]);

    useEffect(() => {
        // Connect to Socket.IO backend
        const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:3001';
        const newSocket = io(SOCKET_URL, {
            withCredentials: true
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to JalRakshak Telemetry Server');
        });

        newSocket.on('fleet_update', (devices) => {
            setFleet(devices);
        });

        newSocket.on('metrics_update', (data) => {
            setMetrics(data);
        });

        newSocket.on('trails_update', (data) => {
            setTrails(data);
        });

        newSocket.on('new_detection', (detection) => {
            setDetections(prev => [detection, ...prev].slice(0, 100)); // Keep last 100
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from Telemetry Server');
        });

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, fleet, metrics, trails, detections }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
