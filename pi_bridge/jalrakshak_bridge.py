"""
JalRakshak Drone Bridge
========================
This script runs on the Raspberry Pi 5 alongside your existing detection system.
It bridges the Pixhawk telemetry and YOLOv8 detections to the JalRakshak dashboard.

Data Flow:
    Pixhawk (serial) → RPi → (4G) → JalRakshak Server → Dashboard
    Camera → YOLOv8 → RPi → (4G) → JalRakshak Server → Dashboard

Usage:
    python jalrakshak_bridge.py                    # Full mode (drone + camera)
    python jalrakshak_bridge.py --simulate         # Simulate (no hardware)
    python jalrakshak_bridge.py --no-detections    # Telemetry only (no YOLO)

Requirements:
    pip install python-socketio requests dronekit
"""

import os
import sys
import time
import json
import argparse
import logging
import threading
import base64
import requests

# ── Configuration ──────────────────────────────────────────────
JALRAKSHAK_SERVER = os.environ.get("JALRAKSHAK_SERVER", "http://localhost:3001")
DRONE_API_KEY = os.environ.get("DRONE_API_KEY", "jalrakshak-drone-secret-2026")
DEVICE_ID = os.environ.get("DEVICE_ID", "UAV-01")

# Pixhawk connection (same as your existing config.py)
PIXHAWK_CONNECTION = "/dev/serial0"
PIXHAWK_BAUD = 57600
PIXHAWK_TIMEOUT = 30

# Telemetry send rate
TELEMETRY_INTERVAL = 1.5   # seconds between GPS/battery updates
MISSION_POLL_INTERVAL = 5  # seconds between checking for new missions

logger = logging.getLogger("jalrakshak_bridge")


class JalRakshakBridge:
    """Bridges Pixhawk + YOLOv8 data to the JalRakshak dashboard."""

    def __init__(self, device_id, server_url, api_key, simulate=False):
        self.device_id = device_id
        self.server_url = server_url.rstrip("/")
        self.api_key = api_key
        self.simulate = simulate
        self.running = True
        self.drone = None
        self.current_mission = None
        self.headers = {
            "Content-Type": "application/json",
            "X-Drone-API-Key": self.api_key
        }

    # ── Pixhawk Connection ──────────────────────────────────
    def connect_pixhawk(self):
        """Connect to Pixhawk flight controller via DroneKit."""
        if self.simulate:
            logger.info("SIMULATE: Skipping Pixhawk connection")
            return True

        try:
            from dronekit import connect as dk_connect

            logger.info(f"Connecting to Pixhawk at {PIXHAWK_CONNECTION}...")
            self.drone = dk_connect(
                PIXHAWK_CONNECTION,
                baud=PIXHAWK_BAUD,
                wait_ready=True,
                heartbeat_timeout=PIXHAWK_TIMEOUT,
            )
            logger.info(f"Pixhawk connected! Mode: {self.drone.mode.name}, "
                       f"GPS: {self.drone.gps_0}, Battery: {self.drone.battery}")
            return True
        except Exception as e:
            logger.error(f"Pixhawk connection failed: {e}")
            return False

    def get_telemetry(self):
        """Read current telemetry from Pixhawk."""
        if self.simulate:
            # Generate simulated telemetry
            import random
            return {
                "lat": 23.035 + random.uniform(-0.005, 0.005),
                "lng": 72.578 + random.uniform(-0.005, 0.005),
                "altitude": 45 + random.uniform(-5, 5),
                "battery": max(0, 100 - (time.time() % 300) / 3),  # Drains over 5 min
                "speed": 8 + random.uniform(-2, 2),
                "heading": int(time.time() * 10) % 360,
                "mode": "AUTO",
                "armed": True
            }

        if not self.drone:
            return None

        try:
            loc = self.drone.location.global_relative_frame
            bat = self.drone.battery
            return {
                "lat": loc.lat,
                "lng": loc.lon,
                "altitude": loc.alt,
                "battery": bat.level if bat.level else 0,
                "speed": self.drone.groundspeed,
                "heading": self.drone.heading,
                "mode": self.drone.mode.name,
                "armed": self.drone.armed
            }
        except Exception as e:
            logger.error(f"Telemetry read error: {e}")
            return None

    # ── Send Telemetry to JalRakshak Server ─────────────────
    def send_telemetry(self, telemetry):
        """POST telemetry to /api/telemetry."""
        payload = {
            "device_id": self.device_id,
            **telemetry
        }
        try:
            resp = requests.post(
                f"{self.server_url}/api/telemetry",
                json=payload,
                headers=self.headers,
                timeout=3
            )
            if resp.status_code == 200:
                data = resp.json()
                sector = data.get("sector")
                if sector:
                    logger.debug(f"Telemetry sent | Sector: {sector}")
            else:
                logger.warning(f"Telemetry failed: HTTP {resp.status_code}")
        except requests.exceptions.ConnectionError:
            logger.warning("Server unreachable — will retry next tick")
        except Exception as e:
            logger.warning(f"Telemetry send error: {e}")

    # ── Send YOLO Detection to JalRakshak Server ────────────
    def send_detection(self, detection, frame=None, gps=None):
        """POST a YOLO detection to /api/telemetry/detection."""
        payload = {
            "device_id": self.device_id,
            "label": detection.get("label", "person"),
            "confidence": detection.get("confidence", 0),
            "lat": gps["lat"] if gps else None,
            "lng": gps.get("lng") or gps.get("lon") if gps else None,
            "bbox": detection.get("bbox"),
        }

        # Attach annotated image as base64 (compressed JPEG)
        if frame is not None:
            try:
                import cv2
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
                payload["image_base64"] = base64.b64encode(buffer).decode('utf-8')
            except Exception as e:
                logger.warning(f"Image encode failed: {e}")

        try:
            resp = requests.post(
                f"{self.server_url}/api/telemetry/detection",
                json=payload,
                headers=self.headers,
                timeout=5
            )
            if resp.status_code == 200:
                logger.info(f"Detection sent: {detection['label']} ({detection['confidence']:.0%})")
            else:
                logger.warning(f"Detection send failed: HTTP {resp.status_code}")
        except Exception as e:
            logger.warning(f"Detection send error: {e}")

    # ── Poll for New Missions from JalRakshak ───────────────
    def poll_missions(self):
        """Check if a new mission has been deployed from the dashboard."""
        try:
            resp = requests.get(
                f"{self.server_url}/api/telemetry/missions/pending",
                params={"device_id": self.device_id},
                headers=self.headers,
                timeout=3
            )
            if resp.status_code != 200:
                return None

            data = resp.json()
            missions = data.get("missions", [])
            if not missions:
                return None

            mission = missions[0]
            if self.current_mission and self.current_mission.get("mission_id") == mission["mission_id"]:
                return None  # Already processing this mission

            logger.info(f"New mission received! ID: {mission['mission_id']}, "
                       f"Waypoints: {len(mission['waypoints'])}")
            return mission

        except Exception as e:
            logger.debug(f"Mission poll error: {e}")
            return None

    def upload_mission_to_pixhawk(self, mission):
        """
        Convert JalRakshak waypoints to MAVLink mission items and 
        upload to Pixhawk.
        """
        waypoints = mission["waypoints"]
        params = mission.get("params", {})
        altitude = params.get("altitude", 45)

        if self.simulate:
            logger.info(f"SIMULATE: Would upload {len(waypoints)} waypoints to Pixhawk at {altitude}m alt")
            self.current_mission = mission
            # Confirm upload
            self._confirm_mission(mission["mission_id"])
            return True

        if not self.drone:
            logger.error("Cannot upload mission: Pixhawk not connected")
            return False

        try:
            from dronekit import Command, VehicleMode
            from pymavlink import mavutil

            logger.info(f"Uploading {len(waypoints)} waypoints to Pixhawk...")

            cmds = self.drone.commands
            cmds.clear()

            # Add takeoff command first
            cmds.add(Command(
                0, 0, 0,
                mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT,
                mavutil.mavlink.MAV_CMD_NAV_TAKEOFF,
                0, 0,
                0, 0, 0, 0,
                waypoints[0][0], waypoints[0][1], altitude
            ))

            # Add each waypoint
            for wp in waypoints:
                cmds.add(Command(
                    0, 0, 0,
                    mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT,
                    mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,
                    0, 0,
                    2,     # Hold time (seconds) at waypoint
                    5,     # Accept radius (meters)
                    0, 0,
                    wp[0], wp[1], altitude
                ))

            # Add RTL (Return to Launch) at end
            cmds.add(Command(
                0, 0, 0,
                mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT,
                mavutil.mavlink.MAV_CMD_NAV_RETURN_TO_LAUNCH,
                0, 0,
                0, 0, 0, 0,
                0, 0, 0
            ))

            cmds.upload()
            logger.info("Mission uploaded to Pixhawk!")

            # Switch to AUTO mode to start the mission
            self.drone.mode = VehicleMode("AUTO")
            logger.info("Switched to AUTO mode — mission starting")

            self.current_mission = mission
            self._confirm_mission(mission["mission_id"])
            return True

        except Exception as e:
            logger.error(f"Mission upload failed: {e}")
            return False

    def _confirm_mission(self, mission_id):
        """Tell JalRakshak server the mission was uploaded to Pixhawk."""
        try:
            requests.patch(
                f"{self.server_url}/api/telemetry/missions/{mission_id}/confirm",
                headers=self.headers,
                timeout=3
            )
            logger.info(f"Mission {mission_id} confirmed to server")
        except Exception as e:
            logger.warning(f"Mission confirm failed: {e}")

    # ── Main Loops ──────────────────────────────────────────
    def telemetry_loop(self):
        """Continuously send telemetry to JalRakshak (runs in thread)."""
        logger.info("Telemetry loop started")
        while self.running:
            telemetry = self.get_telemetry()
            if telemetry:
                self.send_telemetry(telemetry)
            time.sleep(TELEMETRY_INTERVAL)

    def mission_poll_loop(self):
        """Periodically check for new missions from the dashboard (runs in thread)."""
        logger.info("Mission poll loop started")
        while self.running:
            mission = self.poll_missions()
            if mission:
                self.upload_mission_to_pixhawk(mission)
            time.sleep(MISSION_POLL_INTERVAL)

    def run(self, enable_detections=True):
        """Start all bridge services."""
        print()
        print("=" * 60)
        print("  JalRakshak Drone Bridge")
        print("  ─────────────────────────")
        print(f"  Device ID:  {self.device_id}")
        print(f"  Server:     {self.server_url}")
        print(f"  Simulate:   {self.simulate}")
        print(f"  Detections: {enable_detections}")
        print("=" * 60)
        print()

        # Connect to Pixhawk
        if not self.connect_pixhawk():
            if not self.simulate:
                logger.error("Cannot start without Pixhawk. Use --simulate for testing.")
                return

        # Start telemetry thread
        tel_thread = threading.Thread(target=self.telemetry_loop, daemon=True)
        tel_thread.start()

        # Start mission poll thread
        mission_thread = threading.Thread(target=self.mission_poll_loop, daemon=True)
        mission_thread.start()

        # Main loop: if detections are enabled, integrate with your existing detector
        if enable_detections:
            self._run_with_detections()
        else:
            logger.info("Running telemetry-only mode (no YOLO)")
            try:
                while self.running:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nBridge stopped.")
                self.running = False

    def _run_with_detections(self):
        """
        Integration point with your existing detection system.
        
        This imports your existing PersonDetector and runs YOLO inference,
        forwarding detections to JalRakshak.
        """
        try:
            # Import your existing detector
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from detector import PersonDetector
            from config import MODEL_PATH, CONFIDENCE_THRESHOLD, TARGET_CLASS

            logger.info("Loading YOLOv8 model for detection...")
            detector = PersonDetector(
                model_path=MODEL_PATH,
                confidence=CONFIDENCE_THRESHOLD,
                target_class=TARGET_CLASS,
            )
            logger.info("Model loaded!")

            # Setup camera
            from config import USE_PI_CAMERA, CAMERA_RESOLUTION, USB_CAMERA_INDEX
            camera, camera_type = self._setup_camera(USE_PI_CAMERA, CAMERA_RESOLUTION, USB_CAMERA_INDEX)
            if camera is None and not self.simulate:
                logger.error("No camera available")
                return

            logger.info("Detection + Telemetry bridge running. Press Ctrl+C to stop.")
            frame_count = 0

            while self.running:
                try:
                    # Capture frame
                    if self.simulate:
                        import numpy as np
                        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
                    elif camera_type == "picamera":
                        frame = camera.capture_array()
                    else:
                        ret, frame = camera.read()
                        if not ret:
                            continue

                    frame_count += 1

                    # Run YOLO detection every N frames (to not overwhelm)
                    if frame_count % 3 == 0:
                        detections = detector.detect(frame)
                        if detections:
                            gps = self.get_telemetry()
                            for det in detections:
                                det["label"] = "person"
                                self.send_detection(det, frame=frame, gps=gps)

                    time.sleep(0.066)  # ~15 FPS capture

                except Exception as e:
                    logger.error(f"Detection loop error: {e}")
                    time.sleep(1)

        except ImportError as e:
            logger.warning(f"Detection modules not available: {e}")
            logger.info("Falling back to telemetry-only mode")
            try:
                while self.running:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nBridge stopped.")
                self.running = False

        except KeyboardInterrupt:
            print("\nBridge stopped.")
            self.running = False

    def _setup_camera(self, use_pi_camera, resolution, usb_index):
        """Initialize camera (same logic as your existing setup)."""
        if use_pi_camera:
            try:
                from picamera2 import Picamera2
                camera = Picamera2()
                config = camera.create_still_configuration(main={"size": resolution})
                camera.configure(config)
                camera.start()
                time.sleep(2)
                logger.info(f"Pi Camera ready ({resolution[0]}x{resolution[1]})")
                return camera, "picamera"
            except Exception as e:
                logger.warning(f"Pi Camera failed: {e}")

        import cv2
        cap = cv2.VideoCapture(usb_index)
        if cap.isOpened():
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, resolution[0])
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resolution[1])
            logger.info("USB webcam ready")
            return cap, "usb"

        return None, None


def main():
    parser = argparse.ArgumentParser(description="JalRakshak Drone Bridge")
    parser.add_argument("--simulate", action="store_true",
                       help="Simulate mode (no hardware required)")
    parser.add_argument("--no-detections", action="store_true",
                       help="Telemetry only, no YOLO detections")
    parser.add_argument("--device-id", default=DEVICE_ID,
                       help=f"Device ID (default: {DEVICE_ID})")
    parser.add_argument("--server", default=JALRAKSHAK_SERVER,
                       help=f"JalRakshak server URL (default: {JALRAKSHAK_SERVER})")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    bridge = JalRakshakBridge(
        device_id=args.device_id,
        server_url=args.server,
        api_key=DRONE_API_KEY,
        simulate=args.simulate,
    )
    bridge.run(enable_detections=not args.no_detections)


if __name__ == "__main__":
    main()
