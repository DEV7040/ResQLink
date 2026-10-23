"""
ResQLink Backend - Offline-First Emergency Assistant for Low-Connectivity Disaster Areas
FastAPI Server for Prototype Emergency SOS Coordination, Ingestion, Alert Engine & Responder Operations
Matches Complete Architecture Diagram (Client PWA -> Connectivity Layer -> Cloud Backend -> Responder Side)
"""

import os
import json
import threading
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Constants & Paths
BASE_DIR = Path(__file__).resolve().parent
RECORDS_FILE = BASE_DIR / "sos_records.json"
ALERTS_FILE = BASE_DIR / "alerts.json"
RESOURCES_FILE = BASE_DIR / "resources.json"
FILE_LOCK = threading.Lock()

DISCLAIMER_NOTICE = (
    "NOTICE: Backend acknowledgment confirms data receipt on this local prototype server. "
    "It is NOT equivalent to official emergency dispatch. In a real life-threatening emergency, "
    "dial official local emergency numbers (e.g., 112, 911, 100/108) via cellular network."
)

app = FastAPI(
    title="ResQLink Emergency Assistant & Responder API",
    description="Offline-First Emergency Assistant for Disaster Response, SOS Relay, Alert Engine & Responder Triage",
    version="2.0.0"
)

# CORS Configuration - Vite default ports and open local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schemas
class Coordinates(BaseModel):
    latitude: float = Field(..., description="GPS latitude in decimal degrees")
    longitude: float = Field(..., description="GPS longitude in decimal degrees")
    accuracy: Optional[float] = Field(None, description="Accuracy in meters")
    altitude: Optional[float] = Field(None, description="Altitude if available")


class SOSReport(BaseModel):
    report_id: str = Field(..., description="Unique client-generated report identifier")
    timestamp: str = Field(..., description="ISO 8601 timestamp generated at time of trigger")
    emergency_type: str = Field("General Emergency", description="Category of emergency (Medical, Flood, Fire, Trap)")
    message: Optional[str] = Field("", description="Optional message or victim count notes")
    coordinates: Optional[Coordinates] = Field(None, description="Geolocation coordinates if permitted")
    status: str = Field("QUEUED_LOCAL", description="Delivery status tracking")
    client_synced_at: Optional[str] = Field(None, description="Timestamp client initiated network push")
    device_info: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata like user agent, battery, vibration")
    relayed_by_peer: Optional[bool] = Field(False, description="True if report was hopped via P2P relay")
    peer_hop_count: Optional[int] = Field(0, description="Number of P2P mesh relay hops")


class SOSResponse(BaseModel):
    status: str
    report_id: str
    server_received_at: str
    message: str
    disclaimer: str
    total_stored: int


class IncidentStatusUpdate(BaseModel):
    responder_status: str = Field(..., description="Status: PENDING, TRIAGED, DISPATCHED, EN_ROUTE, RESOLVED")
    assigned_agency: Optional[str] = Field(None, description="Police, Ambulance, NDRF, Fire")
    assigned_unit: Optional[str] = Field(None, description="Specific team name or vehicle id")
    responder_notes: Optional[str] = Field("", description="Operational update notes")


class AlertItem(BaseModel):
    alert_id: Optional[str] = None
    title: str = Field(..., description="Alert headline")
    severity: str = Field("WARNING", description="CRITICAL, WARNING, ADVISORY")
    category: str = Field("Disaster", description="Flood, Cyclone, Evacuation, Medical")
    description: str = Field(..., description="Actionable instructions")
    geo_fence: Optional[str] = Field("All Affected Sectors", description="Target zone")
    issued_by: Optional[str] = Field("Emergency Operations Center", description="Issuing agency")
    active: Optional[bool] = True


class RelayBatch(BaseModel):
    relaying_peer_id: str
    reports: List[SOSReport]


# Storage Helper Functions
def _read_json(filepath: Path, default_factory) -> Any:
    if not filepath.exists():
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(default_factory(), f, indent=2)
        return default_factory()
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default_factory()


def _write_json(filepath: Path, data: Any) -> None:
    temp_file = filepath.parent / f"{filepath.stem}_temp_{int(datetime.now().timestamp()*1000)}.json"
    try:
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        temp_file.replace(filepath)
    except Exception as e:
        if temp_file.exists():
            try:
                temp_file.unlink()
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage write error: {str(e)}"
        )


def _read_records() -> List[Dict[str, Any]]:
    return _read_json(RECORDS_FILE, list)


def _write_records(records: List[Dict[str, Any]]) -> None:
    _write_json(RECORDS_FILE, records)


# API Endpoints
@app.get("/", tags=["Health"])
def root_health():
    """Health check endpoint confirming ResQLink backend operational status."""
    return {
        "service": "ResQLink Emergency Assistant & Responder API",
        "status": "online",
        "architecture_layer": "Cloud Backend (REST API Gateway & Alert Engine)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "disclaimer": DISCLAIMER_NOTICE
    }


@app.get("/health", tags=["Health"])
def service_health():
    """Detailed service health, storage, alerts & responder status endpoint."""
    with FILE_LOCK:
        records = _read_records()
        alerts = _read_json(ALERTS_FILE, list)
        resources = _read_json(RESOURCES_FILE, list)
    return {
        "status": "healthy",
        "storage": {
            "file": str(RECORDS_FILE.name),
            "total_records": len(records),
            "accessible": True
        },
        "alerts_count": len(alerts),
        "resources_count": len(resources),
        "server_time": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0"
    }


# ==========================================
# SOS INGESTION & CONFLICT RESOLVER
# ==========================================
@app.post("/sos", response_model=SOSResponse, status_code=status.HTTP_201_CREATED, tags=["SOS"])
def receive_sos_report(report: SOSReport):
    """
    Receive, validate, and persist an SOS report.
    Idempotent: If report_id already exists (repeated sync after reconnection),
    it updates the acknowledgement timestamp without duplicating the record.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    record_dict = report.model_dump()
    record_dict["server_received_at"] = now_iso
    record_dict["server_acknowledged"] = True
    record_dict["status"] = "SERVER_ACKNOWLEDGED"

    if "responder_status" not in record_dict or not record_dict["responder_status"]:
        record_dict["responder_status"] = "PENDING"
    if "triage_priority" not in record_dict:
        etype = record_dict.get("emergency_type", "").lower()
        if "medical" in etype or "collapse" in etype:
            record_dict["triage_priority"] = "CRITICAL"
        elif "flood" in etype or "fire" in etype:
            record_dict["triage_priority"] = "HIGH"
        else:
            record_dict["triage_priority"] = "MEDIUM"

    with FILE_LOCK:
        records = _read_records()
        
        existing_idx = None
        for i, r in enumerate(records):
            if r.get("report_id") == report.report_id:
                existing_idx = i
                break
        
        if existing_idx is not None:
            existing = records[existing_idx]
            record_dict["responder_status"] = existing.get("responder_status", record_dict["responder_status"])
            record_dict["assigned_agency"] = existing.get("assigned_agency", None)
            record_dict["assigned_unit"] = existing.get("assigned_unit", None)
            record_dict["responder_notes"] = existing.get("responder_notes", "")
            records[existing_idx] = record_dict
        else:
            records.insert(0, record_dict)
            
        _write_records(records)
        total_count = len(records)

    return SOSResponse(
        status="ACKNOWLEDGED",
        report_id=report.report_id,
        server_received_at=now_iso,
        message="SOS report successfully persisted and acknowledged by backend server.",
        disclaimer=DISCLAIMER_NOTICE,
        total_stored=total_count
    )


@app.get("/sos", tags=["SOS"])
def get_sos_reports():
    """Retrieve all persisted SOS reports, newest first."""
    with FILE_LOCK:
        records = _read_records()
    return {
        "count": len(records),
        "records": records,
        "disclaimer": DISCLAIMER_NOTICE
    }


# ==========================================
# PEER-TO-PEER (P2P) RELAY BATCH INGESTION
# ==========================================
@app.post("/sos/relay", tags=["P2P Relay"])
def receive_p2p_relayed_reports(batch: RelayBatch):
    """
    Ingest a batch of SOS reports relayed from disconnected victims via a connected peer device.
    Matches 'Peer-to-Peer Relay -> relay via connected peer -> Cloud Backend' in architecture.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    ingested_count = 0

    with FILE_LOCK:
        records = _read_records()
        existing_ids = {r.get("report_id") for r in records}

        for report in batch.reports:
            record_dict = report.model_dump()
            record_dict["server_received_at"] = now_iso
            record_dict["server_acknowledged"] = True
            record_dict["status"] = "SERVER_ACKNOWLEDGED"
            record_dict["relayed_by_peer"] = True
            record_dict["relaying_peer_id"] = batch.relaying_peer_id
            record_dict["peer_hop_count"] = (record_dict.get("peer_hop_count") or 0) + 1
            record_dict["responder_status"] = "PENDING"

            if record_dict["report_id"] not in existing_ids:
                records.insert(0, record_dict)
                existing_ids.add(record_dict["report_id"])
                ingested_count += 1
            else:
                for i, r in enumerate(records):
                    if r.get("report_id") == record_dict["report_id"]:
                        records[i]["server_received_at"] = now_iso
                        records[i]["relayed_by_peer"] = True
                        break

        _write_records(records)

    return {
        "status": "BATCH_ACKNOWLEDGED",
        "relayed_by": batch.relaying_peer_id,
        "new_reports_ingested": ingested_count,
        "total_batch_size": len(batch.reports)
    }


# ==========================================
# ALERT ENGINE (GEO-FENCED BROADCASTS)
# ==========================================
@app.get("/alerts", tags=["Alert Engine"])
def get_alerts():
    """Retrieve active geo-fenced disaster broadcast alerts for PWA clients."""
    with FILE_LOCK:
        alerts = _read_json(ALERTS_FILE, list)
    return {
        "count": len(alerts),
        "alerts": alerts
    }


@app.post("/alerts", status_code=status.HTTP_201_CREATED, tags=["Alert Engine"])
def create_alert(alert: AlertItem):
    """Issue a new civic emergency broadcast or evacuation warning."""
    now_iso = datetime.now(timezone.utc).isoformat()
    alert_dict = alert.model_dump()
    if not alert_dict.get("alert_id"):
        alert_dict["alert_id"] = f"ALT-{int(datetime.now().timestamp())}"
    alert_dict["issued_at"] = now_iso

    with FILE_LOCK:
        alerts = _read_json(ALERTS_FILE, list)
        alerts.insert(0, alert_dict)
        _write_json(ALERTS_FILE, alerts)

    return {
        "status": "ALERT_BROADCAST_SUCCESS",
        "alert": alert_dict
    }


# ==========================================
# RESPONDER SIDE (TRIAGE & DISPATCH DASHBOARD)
# ==========================================
@app.get("/responder/incidents", tags=["Responder"])
def get_responder_incidents():
    """
    Retrieve live incident feed organized for Emergency Services (Police, Ambulance, NDRF, NGOs).
    """
    with FILE_LOCK:
        records = _read_records()

    pending = sum(1 for r in records if r.get("responder_status") == "PENDING")
    dispatched = sum(1 for r in records if r.get("responder_status") in ["TRIAGED", "DISPATCHED", "EN_ROUTE"])
    resolved = sum(1 for r in records if r.get("responder_status") == "RESOLVED")

    return {
        "total_incidents": len(records),
        "pending_triage": pending,
        "active_dispatches": dispatched,
        "resolved": resolved,
        "incidents": records
    }


@app.patch("/sos/{report_id}/status", tags=["Responder"])
def update_incident_triage_status(report_id: str, update: IncidentStatusUpdate):
    """
    Responder triage endpoint: update incident lifecycle status, assign rescue team, add field notes.
    """
    with FILE_LOCK:
        records = _read_records()
        found = False
        updated_record = None

        for i, r in enumerate(records):
            if r.get("report_id") == report_id:
                records[i]["responder_status"] = update.responder_status
                if update.assigned_agency:
                    records[i]["assigned_agency"] = update.assigned_agency
                if update.assigned_unit:
                    records[i]["assigned_unit"] = update.assigned_unit
                if update.responder_notes is not None:
                    records[i]["responder_notes"] = update.responder_notes
                records[i]["last_triage_update"] = datetime.now(timezone.utc).isoformat()
                found = True
                updated_record = records[i]
                break

        if not found:
            raise HTTPException(status_code=404, detail=f"SOS Report {report_id} not found")

        _write_records(records)

    return {
        "status": "STATUS_UPDATED",
        "report_id": report_id,
        "incident": updated_record
    }


@app.get("/responder/resources", tags=["Responder"])
def get_emergency_resources():
    """Retrieve tracked emergency fleet (boats, ambulances, fire tenders, safe shelters)."""
    with FILE_LOCK:
        resources = _read_json(RESOURCES_FILE, list)
    return {
        "count": len(resources),
        "resources": resources
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
