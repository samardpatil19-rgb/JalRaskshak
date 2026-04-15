# Jal Rakshak — AI-Powered River Cleaning Ecosystem

Jal Rakshak (जल रक्षक — "Water Protector") is a full-stack command center for an AI-powered autonomous river cleaning ecosystem. It integrates UAVs (drones), UFVs (unmanned floating vehicles), CCV sensor buoys, and computer vision to detect, verify, and clean river garbage while monitoring water quality and ensuring public safety.

---

## Table of Contents

- [Concept](#concept)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [API Reference](#api-reference)
- [Default Credentials](#default-credentials)
- [How It Works](#how-it-works)
- [Authors](#authors)

---

## Concept

India's rivers face severe pollution from garbage, industrial waste, and sewage. Traditional manual cleanup is slow, dangerous, and unsustainable. Jal Rakshak proposes an autonomous, AI-driven approach:

1. **Detection**: UAVs (drones) patrol designated river sectors using onboard ML models to detect floating garbage, pollution hotspots, and drowning incidents from aerial imagery.

2. **Verification**: Detected objects are sent to the Command Center where a second AI model independently classifies them. If both the drone's onboard ML and the command center's model agree (dual verification), the detection is confirmed — eliminating false positives and saving resources.

3. **Cleaning**: Confirmed garbage locations are dispatched to UFVs (unmanned floating vehicles / cleaning robots) that autonomously navigate to the coordinates and collect the waste.

4. **Monitoring**: CCV (Command Center Vessel) sensor buoys are deployed at fixed locations to continuously monitor water quality parameters — temperature, pH, TDS, dissolved oxygen, BOD, and turbidity.

5. **Safety**: The system monitors for drowning incidents and flood conditions using AI vision and sensor data, triggering real-time alerts to emergency services.

6. **Community**: Citizens can report pollution incidents anonymously, track environmental impact, and participate in community cleanup drives.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    COMMAND CENTER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ React UI │──│ Express  │──│  SQLite  │               │
│  │ (Vite)   │  │ REST API │  │ Database │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│       :5173        :3001      jal_rakshak.db             │
└───────────┬─────────┬───────────┬───────────────────────┘
            │         │           │
     ┌──────┴──┐  ┌───┴────┐  ┌──┴───────┐
     │  UAVs   │  │  UFVs  │  │CCV Buoys │
     │(Drones) │  │(Robots)│  │(Sensors) │
     └─────────┘  └────────┘  └──────────┘
```

- **UAVs** — Aerial patrol drones with onboard ML for garbage and drowning detection
- **UFVs** — Autonomous floating robots that navigate to garbage and collect it
- **CCV Buoys** — Fixed sensor stations measuring water quality in real-time

---

## Features

### Command Center Dashboard
- Real-time map showing all device locations (UAVs, UFVs, CCVs)
- Fleet status with battery levels and operational state
- Garbage collection statistics and breakdown by type

### Autonomous Route Planner
- Click-to-place waypoints on an interactive map
- Supports both UAV (drone) and UFV (cleaning robot) missions
- Mission parameters: payload, speed, RPM, altitude
- Battery consumption estimation based on distance and payload
- Save and load routes from the database
- Export to MAVLink for ArduPilot Mission Planner integration

### AI Vision Verification Lab
- Side-by-side comparison of drone ML detections vs command center analysis
- Confidence scores for both models
- Match/mismatch verification to eliminate false calls
- Impact metrics: false calls prevented, battery saved, verification accuracy

### Water Quality Sensors
- Real-time readings from CCV buoys: temperature, pH, TDS, dissolved oxygen, BOD, turbidity
- 24-hour trend charts with historical data
- Toggle between mock data and live database data
- Multiple CCV station support

### Alerts and Emergency System
- Drowning detection alerts with severity levels
- Flood warning system based on water level monitoring
- Emergency contact directory
- Alert resolution tracking

### Community Hub
- Environmental impact statistics
- Weekly garbage collection charts
- Upcoming community events
- Biodiversity census tracking

### Anonymous Complaint System
- Public complaint form — no login required
- Categories: water pollution, illegal dumping, sewage discharge, etc.
- Generates unique ticket IDs for tracking
- Location input with coordinates
- Admin panel for complaint management

### Authentication
- Email-based login and registration
- JWT token authentication
- Protected routes for operational pages
- Role-based access (admin, operator)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 7 | Build tool and dev server |
| React Router 7 | Client-side routing |
| React Leaflet | Interactive maps |
| Recharts | Data visualization charts |
| Lucide React | Monochrome icon set |
| CSS Variables | Design system with dark theme |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | REST API framework |
| SQLite (better-sqlite3) | Embedded database |
| JSON Web Tokens | Stateless authentication |
| bcryptjs | Password hashing |
| CORS | Cross-origin resource sharing |

### DevOps
| Technology | Purpose |
|---|---|
| Docker | Multi-stage containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy and static file serving |
| AWS EC2 | Cloud deployment (optional) |

### Database Schema
- `users` — id, name, email, password_hash, role, created_at
- `sensor_readings` — id, ccv_id, temp, ph, tds, do_val, bod, turbidity, timestamp
- `routes` — id, user_id, device_type, name, waypoints (JSON), params (JSON), created_at
- `complaints` — id, category, lat, lng, description, ticket_id, status, created_at
- `alerts` — id, type, severity, message, lat, lng, resolved, created_at

---

## Project Structure

```
JalRakshak/
├── server/                    # Backend
│   ├── server.js              # Express entry point
│   ├── db.js                  # SQLite setup and table creation
│   ├── auth.js                # JWT middleware
│   ├── seed.js                # Database seeder with mock data
│   ├── reset_db.js            # Database reset utility
│   └── routes/
│       ├── auth.js            # Login, register, /me
│       ├── sensors.js         # Sensor CRUD and history
│       ├── routeData.js       # Route save/load/delete
│       ├── complaints.js      # Anonymous complaint system
│       └── alerts.js          # Alert management
├── src/                       # Frontend
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Router + auth provider
│   ├── api.js                 # API fetch wrapper
│   ├── index.css              # Global design system
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication state
│   ├── components/
│   │   ├── Sidebar.jsx/css    # Navigation sidebar
│   │   ├── Navbar.jsx/css     # Top navigation bar
│   │   └── StatCard.jsx/css   # Reusable metric card
│   ├── pages/
│   │   ├── Landing.jsx/css    # Public landing page
│   │   ├── Login.jsx/css      # Email login/register
│   │   ├── Dashboard.jsx/css  # Command center map
│   │   ├── RoutePlanner.jsx/css # Waypoint mission planner
│   │   ├── AIVision.jsx/css   # Dual ML verification
│   │   ├── Sensors.jsx/css    # Water quality monitoring
│   │   ├── Alerts.jsx/css     # Emergency alerts
│   │   ├── Community.jsx/css  # Community engagement
│   │   ├── Complaints.jsx/css # Anonymous complaints
│   │   └── About.jsx/css      # Team and technology
│   └── data/
│       └── mockData.js        # Client-side mock data
├── Dockerfile                 # Multi-stage frontend build (React → Nginx)
├── docker-compose.yml         # Orchestrate frontend + backend
├── nginx.conf                 # Nginx reverse proxy config
├── .dockerignore              # Docker build exclusions
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/samardpatil19-rgb/JalRaskshak.git
cd JalRaskshak

# Install dependencies
npm install

# Seed the database with mock data
node server/seed.js
```

### Running

You need two terminal windows:

**Terminal 1 — Backend API Server:**
```bash
node server/server.js
```
The API server starts at `http://localhost:3001`

**Terminal 2 — Frontend Dev Server:**
```bash
npm run dev
```
The website opens at `http://localhost:5173`

### Production Build

```bash
npm run build
```

---

## Docker Deployment

Run the entire application with a single command using Docker Compose:

### Prerequisites
- Docker and Docker Compose installed ([Get Docker](https://docs.docker.com/get-docker/))

### Quick Start

```bash
# Clone and enter the project
git clone https://github.com/samardpatil19-rgb/JalRaskshak.git
cd JalRaskshak

# Build and start both containers
docker compose up --build -d
```

The application will be available at `http://localhost`

### Architecture

```
┌───────────────────────────────────────────────┐
│              Docker Compose                    │
│                                                │
│  ┌──────────────────┐  ┌───────────────────┐  │
│  │    Frontend       │  │     Backend       │  │
│  │  (Nginx:80)       │──│  (Express:3001)   │  │
│  │  React SPA        │  │  REST API         │  │
│  │  Reverse Proxy    │  │  SQLite DB        │  │
│  └──────────────────┘  └───────────────────┘  │
│         :80                   :3001            │
└───────────────────────────────────────────────┘
```

- **Frontend container**: Multi-stage build — React compiled with Vite, served by Nginx, `/api/` requests reverse-proxied to the backend
- **Backend container**: Node.js Alpine running Express, SQLite database persisted via Docker volume

### Commands

```bash
# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild after code changes
docker compose up --build -d
```

---

## AWS Deployment

Deploy Jal Rakshak on AWS EC2 for cloud hosting.

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Amazon Linux 2023** or **Ubuntu 22.04** (free-tier eligible)
3. Instance type: **t2.micro** (free tier)
4. Security Group — allow inbound:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS, optional)
5. Create/download a key pair (.pem file)

### Step 2: SSH and Install Docker

```bash
# SSH into your instance
ssh -i your-key.pem ec2-user@<PUBLIC_IP>

# Install Docker (Amazon Linux)
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes
exit
ssh -i your-key.pem ec2-user@<PUBLIC_IP>
```

### Step 3: Deploy

```bash
# Clone the repo
git clone https://github.com/samardpatil19-rgb/JalRaskshak.git
cd JalRaskshak

# Set production JWT secret
export JWT_SECRET=$(openssl rand -hex 32)

# Build and run
docker compose up --build -d
```

Your app is now live at `http://<PUBLIC_IP>`

---

## API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account (name, email, password) | No |
| POST | `/api/auth/login` | Login (email, password) → JWT token | No |
| GET | `/api/auth/me` | Get current user info | Yes |

### Sensors
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/sensors` | Log a sensor reading | Yes |
| GET | `/api/sensors/:ccvId` | Get readings (optional ?from=&to=&limit=) | No |
| GET | `/api/sensors/:ccvId/latest` | Get latest reading | No |

### Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/routes` | Save a planned route | Yes |
| GET | `/api/routes` | List user's saved routes | Yes |
| GET | `/api/routes/:id` | Get single route | Yes |
| DELETE | `/api/routes/:id` | Delete a route | Yes |

### Complaints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/complaints` | Submit anonymous complaint | No |
| GET | `/api/complaints` | List all complaints | Yes |
| GET | `/api/complaints/:ticketId` | Lookup by ticket ID | No |
| PATCH | `/api/complaints/:id/status` | Update complaint status | Yes |

### Alerts
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/alerts` | List alerts (?type=&resolved=) | No |
| POST | `/api/alerts` | Create new alert | Yes |
| PATCH | `/api/alerts/:id/resolve` | Mark alert as resolved | Yes |

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
3. Detection data (label, confidence, coordinates) is sent to the Command Center
4. Command Center runs its own classification model on the same imagery
5. If both models agree → UFV is dispatched to collect the garbage
6. If models disagree → flagged for manual review, preventing false dispatches

### Water Quality Monitoring
1. CCV buoys are anchored at strategic river locations
2. Sensors continuously measure 6 parameters every 30 minutes
3. Data is transmitted to the Command Center and stored in the database
4. Abnormal readings trigger automated alerts
5. Historical trends are visualized for long-term analysis

### Drowning and Flood Detection
1. UAV cameras and CCV sensors monitor for anomalies
2. AI models detect human-shaped objects in water
3. Water level sensors detect rising levels beyond thresholds
4. Critical alerts are immediately pushed to the dashboard
5. Emergency contacts are displayed for rapid response

---

## Authors

Built as a final year project demonstrating the integration of AI, robotics, and IoT for environmental conservation and public safety along India's rivers.

---

## License

This project is for educational and research purposes.
