# 🌊 Jal Rakshak — AI-Powered Autonomous River Cleaning System

> **जल रक्षक** ("Water Protector") — A full-stack command center for an AI-powered autonomous river cleaning ecosystem integrating UAVs, UFVs, sensor buoys, real-time telemetry, computer vision, and Raspberry Pi hardware.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📋 Table of Contents

- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [SITL Simulation Engine](#sitl-simulation-engine)
- [Hardware Integration (Raspberry Pi)](#hardware-integration-raspberry-pi)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [API Reference](#api-reference)
- [Default Credentials](#default-credentials)
- [How It Works](#how-it-works)
- [Authors](#authors)

---

## The Problem

India's rivers face severe pollution from garbage, industrial waste, and sewage. Traditional manual cleanup is slow, dangerous, and unsustainable. Over 80% of India's surface water is polluted, and manual cleanup operations cover less than 5% of affected waterways.

## Our Solution

Jal Rakshak proposes an autonomous, AI-driven approach with five integrated subsystems:

1. **Detection** — UAVs (drones) patrol river sectors using onboard YOLOv8 to detect floating garbage, pollution hotspots, and drowning incidents from aerial imagery
2. **Verification** — Detected objects are dual-verified by the Command Center's independent ML model. If both agree, the detection is confirmed — eliminating false positives
3. **Cleaning** — Confirmed garbage locations are dispatched to UFVs (cleaning robots) that autonomously navigate and collect waste using conveyor systems
4. **Monitoring** — CCV sensor buoys continuously measure water quality (pH, TDS, dissolved oxygen, BOD, turbidity, temperature)
5. **Safety** — AI-based drowning and flood detection triggers real-time emergency alerts

---

## System Architecture

```
                         ┌──────────────────────────────────────────────────┐
                         │              JALRAKSHAK COMMAND CENTER           │
                         │                                                  │
                         │  ┌───────────┐  ┌───────────┐  ┌────────────┐   │
                         │  │  React UI │──│ Express   │──│  SQLite    │   │
                         │  │  (Vite)   │  │ REST +    │  │  Database  │   │
                         │  │  :5173    │  │ Socket.io │  │            │   │
                         │  └───────────┘  │ :3001     │  └────────────┘   │
                         │                 └─────┬─────┘                   │
                         └───────────────────────┼─────────────────────────┘
                                                 │ WebSocket + REST
                    ┌────────────────────────────┼────────────────────────┐
                    │                            │                        │
           ┌────────┴────────┐          ┌────────┴───────┐       ┌───────┴───────┐
           │  UAV (Drone)    │          │  UFV (Robot)   │       │  CCV (Buoy)   │
           │  ┌────────────┐ │          │                │       │               │
           │  │ Pixhawk FC │ │          │  Autonomous    │       │  pH, TDS, DO  │
           │  │  (MAVLink)  │ │          │  Cleaning     │       │  BOD, Temp    │
           │  └──────┬─────┘ │          │  Robot         │       │  Turbidity    │
           │  ┌──────┴─────┐ │          │                │       │               │
           │  │ RPi 5      │ │          └────────────────┘       └───────────────┘
           │  │ + YOLOv8   │ │
           │  │ + Camera   │ │
           │  │ + 4G LTE   │ │
           │  └────────────┘ │
           └─────────────────┘
```

### Data Flow (Drone → Dashboard)

```
Pixhawk FC ──serial──► Raspberry Pi 5 ──4G/WiFi──► JalRakshak Server ──Socket.io──► Dashboard
   (GPS, battery,       (combines telemetry         (stores in SQLite,              (live map,
    altitude, speed)      + YOLO detections)          broadcasts to all)             fleet panel)
```

---

## Features

### 🗺️ Command Center Dashboard (`/dashboard`)
- Real-time Leaflet map showing all device locations (UAVs, UFVs, CCVs)
- **Dynamic device placement** — click-to-place any device type on the map
- Live fleet status panels with battery bars, sector assignments, status badges
- Active mission route trails rendered as dashed polylines on the map
- **CCV sector detection** — devices auto-switch to the nearest CCV as they move
- Real-time ML detection feed showing YOLOv8 results from drones
- Detection markers on the map as pulsing red dots
- Garbage collection statistics and breakdown by type (plastic, organic, debris)

### 🛣️ Autonomous Route Planner (`/route-planner`)
- Click-to-place waypoints on an interactive map
- Supports UAV (drone) and UFV (cleaning robot) missions
- Mission parameters: payload, speed, RPM, altitude
- Battery consumption estimation based on distance and payload
- Save, load, and delete routes from the database
- **Deploy missions** to idle devices — the simulator moves them along the route
- Export to MAVLink format for ArduPilot Mission Planner integration

### 🤖 AI Vision Verification Lab (`/ai-vision`)
- Side-by-side comparison of drone ML detections vs command center analysis
- Dual confidence scores with match/mismatch verification
- Impact metrics: false calls prevented, battery saved, verification accuracy

### 📊 Water Quality Sensors (`/sensors`)
- Real-time readings from CCV buoys: temperature, pH, TDS, dissolved oxygen, BOD, turbidity
- 24-hour trend charts with historical data (Recharts)
- Toggle between mock data and live database data
- Multiple CCV station support with station selector

### 🚨 Alerts & Emergency System (`/alerts`)
- Drowning detection alerts with severity levels (critical, warning, info)
- Flood warning system based on water level monitoring
- Emergency contact directory
- Alert resolution tracking with status updates

### 🔧 Hardware Integration (`/hardware`)
- **Live device registry** — see all connected RPi drones with online/offline status
- **Step-by-step setup guide** with copyable commands
- Server URL configuration and API key display
- Test connection button to verify server reachability
- Architecture diagram showing Pixhawk → RPi → 4G → Server pipeline

### 🌿 Community Hub (`/community`)
- Environmental impact statistics and weekly garbage charts
- Upcoming community cleanup events
- Biodiversity census tracking (species, trends, habitats)

### 📝 Anonymous Complaint System (`/complaints`)
- Public complaint form — no login required
- Categories: water pollution, illegal dumping, sewage discharge, etc.
- Unique ticket IDs for tracking
- Admin panel for complaint management

### 🔐 Authentication
- Email/password login and registration with JWT tokens
- Google OAuth 2.0 sign-in
- Protected routes for operational pages
- Role-based access (admin, operator)

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework with hooks |
| Vite | 7.3 | Build tool and HMR dev server |
| React Router | 7.13 | Client-side routing (11 pages) |
| React Leaflet | 5.0 | Interactive maps with markers, polylines, circles |
| Leaflet | 1.9.4 | Map rendering engine |
| Recharts | 3.7 | Data visualization (sensor charts, garbage trends) |
| Lucide React | 0.563 | Monochrome icon library |
| Socket.IO Client | 4.8 | Real-time bidirectional communication |
| CSS Variables | — | Custom design system with dark theme |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | 5.2 | REST API framework |
| Socket.IO | 4.8 | WebSocket server for real-time telemetry |
| better-sqlite3 | 12.6 | Embedded SQLite database (WAL mode) |
| JSON Web Tokens | 9.0 | Stateless authentication |
| bcryptjs | 3.0 | Password hashing |
| Google Auth Library | 10.6 | Google OAuth verification |
| concurrently | 9.2 | Run frontend + backend simultaneously |

### Hardware (Raspberry Pi 5)

| Technology | Purpose |
|---|---|
| Python 3.11 | Bridge script runtime |
| DroneKit | MAVLink communication with Pixhawk FC |
| pymavlink | Low-level MAVLink protocol |
| YOLOv8 (Ultralytics) | Real-time object detection (NCNN backend) |
| picamera2 | Pi Camera interface |
| python-socketio / requests | HTTP communication with JalRakshak server |

### DevOps

| Technology | Purpose |
|---|---|
| Docker | Multi-stage containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy and static file serving |
| AWS EC2 | Cloud deployment (t2.micro free tier) |

---

## Database Schema

8 tables in SQLite with WAL mode enabled:

| Table | Key Columns | Purpose |
|---|---|---|
| `users` | id, name, email, password_hash, role | Authentication |
| `devices` | id, type, status, battery(REAL), lat, lng, sector | Fleet tracking |
| `missions` | id, device_id, route_id, status, waypoint_index | Active mission state |
| `routes` | id, user_id, device_type, name, waypoints(JSON), params(JSON) | Saved mission plans |
| `detections` | id, device_id, label, confidence, lat, lng, bbox, image_path | YOLO ML results |
| `sensor_readings` | id, ccv_id, temp, ph, tds, do_val, bod, turbidity | Water quality data |
| `alerts` | id, type, severity, message, lat, lng, resolved | Emergency alerts |
| `complaints` | id, category, ticket_id, description, lat, lng, status | Public complaints |

---

## Project Structure

```
JalRakshak/
├── server/                         # ── Backend ──────────────────────────
│   ├── server.js                   # Express + Socket.IO entry point
│   ├── db.js                       # SQLite init (8 tables, WAL mode)
│   ├── auth.js                     # JWT middleware
│   ├── simulator.js                # SITL engine (waypoint following, CCV sectors)
│   ├── seed.js                     # Database seeder (users, sensors, devices, routes)
│   ├── reset_db.js                 # Full database reset utility
│   ├── test_db.js                  # Database diagnostic script
│   ├── Dockerfile                  # Backend container
│   └── routes/
│       ├── auth.js                 # POST /login, /register, GET /me
│       ├── sensors.js              # Sensor CRUD and history
│       ├── routeData.js            # Route save/load/deploy/delete
│       ├── devices.js              # Device CRUD (dynamic placement)
│       ├── telemetry.js            # RPi telemetry + detection ingestion
│       ├── complaints.js           # Anonymous complaint system
│       └── alerts.js               # Alert management
│
├── src/                            # ── Frontend ─────────────────────────
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Router + providers (Auth, Socket, Google)
│   ├── api.js                      # REST API wrapper (all endpoints)
│   ├── index.css                   # Global design system (CSS variables)
│   ├── context/
│   │   ├── AuthContext.jsx         # Authentication state + JWT management
│   │   └── SocketContext.jsx       # Socket.IO state (fleet, metrics, trails, detections)
│   ├── components/
│   │   ├── Sidebar.jsx/css         # Navigation sidebar (11 links)
│   │   ├── Navbar.jsx/css          # Top navigation bar
│   │   └── StatCard.jsx/css        # Reusable metric card component
│   ├── pages/
│   │   ├── Landing.jsx/css         # Public landing page
│   │   ├── Login.jsx/css           # Email + Google OAuth login
│   │   ├── Dashboard.jsx/css       # Command center (map, fleet, detections)
│   │   ├── RoutePlanner.jsx/css    # Waypoint mission planner + deploy
│   │   ├── AIVision.jsx/css        # Dual ML verification lab
│   │   ├── Sensors.jsx/css         # Water quality monitoring
│   │   ├── Alerts.jsx/css          # Emergency alert system
│   │   ├── Hardware.jsx/css        # RPi connection setup + device registry
│   │   ├── Community.jsx/css       # Community engagement hub
│   │   ├── Complaints.jsx/css      # Anonymous complaint form
│   │   └── About.jsx/css           # Team and technology info
│   └── data/
│       └── mockData.js             # Client-side fallback data
│
├── pi_bridge/                      # ── Raspberry Pi Bridge ──────────────
│   └── jalrakshak_bridge.py        # Python bridge: Pixhawk + YOLO → Server
│
├── Dockerfile                      # Frontend multi-stage build (Vite → Nginx)
├── docker-compose.yml              # Orchestrate frontend + backend containers
├── nginx.conf                      # Nginx reverse proxy configuration
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration
└── index.html                      # HTML entry point
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
git clone https://github.com/samardpatil19-rgb/JalRaskshak.git
cd JalRaskshak
npm install
```

### Database Setup

```bash
# First time — create tables and seed data
node server/seed.js

# To fully reset (drops all tables, re-creates schema)
node server/reset_db.js
node server/seed.js
```

### Running

```bash
npm run dev
```

This starts both servers simultaneously via `concurrently`:
- **Frontend** → `http://localhost:5173`
- **Backend API** → `http://localhost:3001`

### Production Build

```bash
npm run build    # Creates optimized bundle in dist/
```

---

## SITL Simulation Engine

The Software-In-The-Loop (SITL) simulator runs inside the Node.js server and provides realistic device movement without real hardware.

### How It Works

1. **Deploy a mission** — In the Route Planner, save a route and deploy it to an idle UAV or UFV
2. **Waypoint following** — The simulator moves the device toward each waypoint at realistic speeds (UAV: ~12 m/s, UFV: ~4 m/s)
3. **Battery drain** — Battery depletes at type-specific rates during missions
4. **CCV sector detection** — As devices move, the simulator calculates the nearest CCV and updates the device's sector assignment
5. **Trash collection** — UFVs randomly accumulate trash at waypoints during missions
6. **Mission completion** — When all waypoints are visited (or battery dies), the device returns to idle

### Real-Time Broadcasting

Every 2 seconds, the simulator:
- Updates all active device positions in SQLite
- Broadcasts `fleet_update` with all device states via Socket.IO
- Broadcasts `metrics_update` with active missions, total trash, device counts
- Broadcasts `trails_update` with active mission route polylines

---

## Hardware Integration (Raspberry Pi)

The system supports connecting real Raspberry Pi 5 drones with Pixhawk flight controllers.

### Architecture

```
┌─────────────── ON THE DRONE ──────────────────┐
│                                                │
│  Pixhawk FC ──serial──► Raspberry Pi 5         │
│  (GPS, battery,          (DroneKit/MAVLink)    │
│   altitude, heading)                           │
│                          Camera ──► YOLOv8     │
│                          (detections, frames)  │
│                                                │
│  RPi combines both ─────────────────────────── │──► 4G LTE Dongle
└────────────────────────────────────────────────┘         │
                                                    ┌──────▼──────┐
                                                    │  JalRakshak │
                                                    │  Server     │
                                                    └─────────────┘
```

### Setup

1. Copy bridge script to your Pi:
```bash
scp pi_bridge/jalrakshak_bridge.py pi@<pi-ip>:~/
```

2. Install Python dependencies on Pi:
```bash
pip install dronekit pymavlink requests ultralytics
```

3. Run the bridge:
```bash
# Full mode (Pixhawk + Camera + YOLO)
python jalrakshak_bridge.py --server http://<server-ip>:3001 --device-id UAV-01

# Simulate mode (no hardware needed — for testing)
python jalrakshak_bridge.py --simulate --server http://localhost:3001
```

4. Verify on the Dashboard — your device appears on the map with live telemetry

### Bridge Threads

The bridge runs 3 concurrent threads:

| Thread | Function | Interval |
|---|---|---|
| Telemetry Loop | Reads Pixhawk GPS/battery → sends to server | 1.5s |
| Mission Poll Loop | Checks for new missions → uploads to Pixhawk as MAVLink waypoints | 5s |
| Detection Loop | Runs YOLOv8 inference → sends detections to server | Per frame (~15 FPS) |

### API Key Authentication

Drone-to-server communication uses a shared API key:
```
X-Drone-API-Key: jalrakshak-drone-secret-2026
```

Set via environment variable: `DRONE_API_KEY`

---

## Docker Deployment

```bash
docker compose up --build -d
```

The app is available at `http://localhost`

### Container Architecture

```
┌──────────────────────────────────────────────┐
│              Docker Compose                   │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │    Frontend       │  │     Backend      │  │
│  │  Nginx :80        │──│  Express :3001   │  │
│  │  React SPA        │  │  Socket.IO       │  │
│  │  Reverse Proxy    │  │  SQLite + SITL   │  │
│  └──────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────┘
```

### Commands
```bash
docker compose up -d           # Start
docker compose logs -f         # View logs
docker compose down            # Stop
docker compose up --build -d   # Rebuild after changes
```

---

## AWS Deployment

### Step 1: Launch EC2
- AMI: Amazon Linux 2023 or Ubuntu 22.04 (free-tier t2.micro)
- Security Group: allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Step 2: Install Docker
```bash
ssh -i your-key.pem ec2-user@<PUBLIC_IP>
sudo yum update -y && sudo yum install -y docker
sudo service docker start && sudo usermod -aG docker ec2-user
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Deploy
```bash
git clone https://github.com/samardpatil19-rgb/JalRaskshak.git
cd JalRaskshak
export JWT_SECRET=$(openssl rand -hex 32)
docker compose up --build -d
```

Live at `http://<PUBLIC_IP>`

---

## API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Login → JWT token | No |
| POST | `/api/auth/google` | Google OAuth login | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Devices
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/devices` | List all devices | No |
| POST | `/api/devices` | Create device (type, lat, lng) | Yes |
| DELETE | `/api/devices/:id` | Remove idle device | Yes |

### Telemetry (Drone → Server)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/telemetry` | Send GPS/battery from RPi | API Key |
| POST | `/api/telemetry/detection` | Send YOLO detection + image | API Key |
| GET | `/api/telemetry/detections` | Fetch recent detections | No |
| GET | `/api/telemetry/missions/pending` | RPi polls for new missions | API Key |
| PATCH | `/api/telemetry/missions/:id/confirm` | RPi confirms Pixhawk upload | API Key |
| PATCH | `/api/telemetry/missions/:id/complete` | RPi signals mission done | API Key |

### Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/routes` | Save planned route | Yes |
| GET | `/api/routes` | List saved routes | Yes |
| GET | `/api/routes/:id` | Get single route | Yes |
| POST | `/api/routes/deploy` | Deploy route to device | Yes |
| DELETE | `/api/routes/:id` | Delete route | Yes |

### Sensors
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/sensors` | Log sensor reading | Yes |
| GET | `/api/sensors/:ccvId` | Get readings (with filters) | No |
| GET | `/api/sensors/:ccvId/latest` | Get latest reading | No |

### Complaints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/complaints` | Submit anonymous complaint | No |
| GET | `/api/complaints` | List all complaints | Yes |
| GET | `/api/complaints/:ticketId` | Lookup by ticket ID | No |

### Alerts
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/alerts` | List alerts (filterable) | No |
| POST | `/api/alerts` | Create alert | Yes |
| PATCH | `/api/alerts/:id/resolve` | Resolve alert | Yes |

### Health
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/health` | Server health check | No |

---

## Default Credentials

| Email | Password | Role |
|---|---|---|
| `admin@jalrakshak.in` | `admin123` | Admin |

New users can register through the Sign Up page.

---

## How It Works

### Garbage Detection Pipeline
1. UAV flies a pre-planned route over the river sector
2. Onboard YOLOv8 model detects floating objects in real-time
3. Detection data (label, confidence, GPS coordinates, annotated image) is sent to the Command Center via 4G
4. Command Center runs its own classification model on the imagery
5. If both models agree → UFV is dispatched to collect the garbage
6. If models disagree → flagged for manual review, preventing false dispatches

### SITL Simulation Flow
1. User places devices on the map (UAVs, UFVs, CCVs)
2. User plans a route in Route Planner with waypoints
3. User deploys the route to an idle device
4. Simulator moves the device along waypoints every 2 seconds
5. Device's sector updates as it passes between CCVs
6. Battery drains, trash accumulates, mission completes

### Hardware Integration Flow
1. RPi bridge connects to Pixhawk via serial and JalRakshak via 4G
2. GPS/battery telemetry streams to server every 1.5 seconds
3. User deploys a mission from the dashboard
4. RPi downloads waypoints and uploads to Pixhawk as MAVLink mission items
5. Pixhawk flies the route autonomously
6. YOLOv8 detections are forwarded to the dashboard in real-time

### Water Quality Monitoring
1. CCV buoys measure 6 parameters every 30 minutes
2. Data streams to the Command Center database
3. Abnormal readings trigger automated alerts
4. Historical trends visualized with 24-hour charts

---

## Authors

Built by **Samar Patil**, **Aaryan Patil**, **Akhilesh Kulkarni**, and **Vinay Shedge** as a final year project demonstrating the integration of AI, robotics, IoT, and full-stack development for environmental conservation along India's rivers.

---

## License

This project is for educational and research purposes.
