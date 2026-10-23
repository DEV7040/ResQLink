"""
Backend unit & integration tests for ResQLink FastAPI server.
"""

import os
import json
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

from app import app, RECORDS_FILE, _read_records, _write_records

class TestResQLinkBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        if RECORDS_FILE.exists():
            with open(RECORDS_FILE, "r", encoding="utf-8") as f:
                self.backup = f.read()
        else:
            self.backup = "[]"
        _write_records([])

    def tearDown(self):
        with open(RECORDS_FILE, "w", encoding="utf-8") as f:
            f.write(self.backup)

    def test_root_health(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("disclaimer", data)

    def test_health_endpoint(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["storage"]["accessible"])
        self.assertEqual(data["storage"]["total_records"], 0)

    def test_post_sos_and_get_sos(self):
        payload = {
            "report_id": "TEST-SOS-001",
            "timestamp": "2026-10-22T12:00:00Z",
            "emergency_type": "Flood / Water Trap",
            "message": "Water rising rapidly, 2 people stranded",
            "coordinates": {
                "latitude": 28.6139,
                "longitude": 77.2090,
                "accuracy": 8.5
            },
            "status": "QUEUED_OFFLINE"
        }

        post_res = self.client.post("/sos", json=payload)
        self.assertEqual(post_res.status_code, 201)
        post_data = post_res.json()
        self.assertEqual(post_data["status"], "ACKNOWLEDGED")
        self.assertEqual(post_data["report_id"], "TEST-SOS-001")
        self.assertIn("disclaimer", post_data)
        self.assertEqual(post_data["total_stored"], 1)

        get_res = self.client.get("/sos")
        self.assertEqual(get_res.status_code, 200)
        get_data = get_res.json()
        self.assertEqual(get_data["count"], 1)
        record = get_data["records"][0]
        self.assertEqual(record["report_id"], "TEST-SOS-001")
        self.assertEqual(record["status"], "SERVER_ACKNOWLEDGED")
        self.assertTrue(record["server_acknowledged"])

        retry_res = self.client.post("/sos", json=payload)
        self.assertEqual(retry_res.status_code, 201)
        get_res2 = self.client.get("/sos")
        self.assertEqual(get_res2.json()["count"], 1)

    def test_sos_without_coordinates(self):
        payload = {
            "report_id": "TEST-SOS-NO-GPS",
            "timestamp": "2026-10-22T12:05:00Z",
            "emergency_type": "Medical Trauma",
            "message": "Severe bleeding, no GPS available",
            "coordinates": None,
            "status": "QUEUED_OFFLINE"
        }
        res = self.client.post("/sos", json=payload)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["report_id"], "TEST-SOS-NO-GPS")

if __name__ == "__main__":
    unittest.main()
