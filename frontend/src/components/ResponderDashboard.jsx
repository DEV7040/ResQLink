import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Radio, 
  RefreshCw, 
  Truck, 
  CheckCircle2, 
  ChevronRight
} from 'lucide-react';
import { formatCoordinates } from '../utils/location';

export default function ResponderDashboard({ isOnline, isSimulatedOffline }) {
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState({ total_incidents: 0, pending_triage: 0, active_dispatches: 0, resolved: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  const [triageStatus, setTriageStatus] = useState("DISPATCHED");
  const [assignedAgency, setAssignedAgency] = useState("NDRF");
  const [assignedUnit, setAssignedUnit] = useState("NDRF Quick-Response Boat Unit 04");
  const [responderNotes, setResponderNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("CRITICAL");
  const [alertCategory, setAlertCategory] = useState("Flood Warning");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertZone, setAlertZone] = useState("Sector 4 Lowlands");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const effectiveOnline = isOnline && !isSimulatedOffline;

  const loadResponderData = async () => {
    if (!effectiveOnline) return;
    setIsLoading(true);
    try {
      const [incRes, resRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/responder/incidents"),
        fetch("http://127.0.0.1:8000/responder/resources")
      ]);

      if (incRes.ok) {
        const data = await incRes.json();
        setIncidents(data.incidents || []);
        setStats({
          total_incidents: data.total_incidents || 0,
          pending_triage: data.pending_triage || 0,
          active_dispatches: data.active_dispatches || 0,
          resolved: data.resolved || 0
        });
      }

      if (resRes.ok) {
        const rData = await resRes.json();
        setResources(rData.resources || []);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResponderData();
    const interval = setInterval(loadResponderData, 8000);
    return () => clearInterval(interval);
  }, [effectiveOnline]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/sos/${selectedIncident.report_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responder_status: triageStatus,
          assigned_agency: assignedAgency,
          assigned_unit: assignedUnit,
          responder_notes: responderNotes
        })
      });

      if (res.ok) {
        await loadResponderData();
        setSelectedIncident(null);
      }
    } catch (err) {
      alert("Failed updating triage status: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertDescription.trim()) return;

    setIsBroadcasting(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: alertTitle,
          severity: alertSeverity,
          category: alertCategory,
          description: alertDescription,
          geo_fence: alertZone,
          issued_by: "Disaster Coordination Command"
        })
      });

      if (res.ok) {
        setShowBroadcastModal(false);
        setAlertTitle("");
        setAlertDescription("");
        alert("Emergency Alert broadcast successfully to all PWA client devices!");
      }
    } catch (err) {
      alert("Broadcast failed: " + err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="responder-dashboard-section">
      <div className="responder-top-bar">
        <div className="responder-brand">
          <ShieldAlert size={26} className="text-red" />
          <div>
            <h3>Emergency Operations Center (EOC) — Responder Portal</h3>
            <p className="text-muted">
              Live incident triage, resource tracking, and civil defense dispatch (Police • Ambulance • NDRF • Fire)
            </p>
          </div>
        </div>

        <div className="location-actions-cell">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowBroadcastModal(true)}
            disabled={!effectiveOnline}
          >
            <Radio size={16} />
            <span>Broadcast Disaster Alert</span>
          </button>

          <button
            type="button"
            className="btn-toolbar"
            onClick={loadResponderData}
            disabled={isLoading || !effectiveOnline}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-num">{stats.total_incidents}</span>
          <span className="text-muted">Total Ingested SOS</span>
        </div>
        <div className="metric-card">
          <span className="metric-num text-red">{stats.pending_triage}</span>
          <span className="text-muted">Pending Triage</span>
        </div>
        <div className="metric-card">
          <span className="metric-num text-amber">{stats.active_dispatches}</span>
          <span className="text-muted">Active Dispatches</span>
        </div>
        <div className="metric-card">
          <span className="metric-num text-success">{stats.resolved}</span>
          <span className="text-muted">Resolved / Safe</span>
        </div>
      </div>

      <div className="responder-layout-grid">
        <div className="incidents-panel">
          <div className="panel-header">
            <h4>Live Incident Feed & Triage Queue</h4>
            <span>{incidents.length} Records</span>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {incidents.length === 0 ? (
              <div className="history-empty-state">
                <CheckCircle2 size={36} className="text-success" />
                <p>No active incidents recorded. Listening for incoming PWA SOS beacons.</p>
              </div>
            ) : (
              <div>
                {incidents.map((inc) => {
                  const status = inc.responder_status || "PENDING";
                  const priority = inc.triage_priority || "HIGH";
                  const isSelected = selectedIncident?.report_id === inc.report_id;

                  return (
                    <div
                      key={inc.report_id}
                      className="incident-item-card"
                      style={{ border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-subtle)' }}
                      onClick={() => {
                        setSelectedIncident(inc);
                        setTriageStatus(inc.responder_status || "DISPATCHED");
                        setAssignedAgency(inc.assigned_agency || "NDRF");
                        setAssignedUnit(inc.assigned_unit || "NDRF Quick-Response Boat Unit 04");
                        setResponderNotes(inc.responder_notes || "");
                      }}
                    >
                      <div className="summary-row">
                        <span><strong>{priority}</strong> &bull; {status}</span>
                        <span className="text-muted">
                          {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h5 className="font-bold">{inc.emergency_type}</h5>
                      <p className="text-muted">{inc.message || "No notes provided"}</p>

                      <div className="summary-row">
                        <span>
                          <MapPin size={13} className="text-red inline-icon" />
                          {inc.coordinates 
                            ? formatCoordinates(inc.coordinates.latitude, inc.coordinates.longitude)
                            : "No GPS fix"}
                        </span>
                        {inc.device_info?.battery?.level != null && (
                          <span>Battery: {inc.device_info.battery.level}%</span>
                        )}
                      </div>

                      {inc.assigned_agency && (
                        <div style={{ color: 'var(--emerald-400)', fontSize: '0.75rem', marginTop: '4px' }}>
                          <Truck size={13} className="inline-icon" /> Assigned: {inc.assigned_agency} ({inc.assigned_unit || "Active"})
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="action-resources-col">
          {selectedIncident ? (
            <div className="dashboard-card" style={{ padding: '16px' }}>
              <div className="summary-row" style={{ marginBottom: '12px' }}>
                <h4>Dispatch Incident: <code>{selectedIncident.report_id}</code></h4>
                <button type="button" className="btn-toolbar" onClick={() => setSelectedIncident(null)}>✕</button>
              </div>

              <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Lifecycle Status:</label>
                  <select
                    className="form-select"
                    value={triageStatus}
                    onChange={(e) => setTriageStatus(e.target.value)}
                  >
                    <option value="PENDING">PENDING (Awaiting Review)</option>
                    <option value="TRIAGED">TRIAGED (Assessed & Verified)</option>
                    <option value="DISPATCHED">DISPATCHED (Rescue Dispatched)</option>
                    <option value="EN_ROUTE">EN_ROUTE (Approaching Target)</option>
                    <option value="RESOLVED">RESOLVED (Victims Extricated / Safe)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Primary Responding Agency:</label>
                  <select
                    className="form-select"
                    value={assignedAgency}
                    onChange={(e) => setAssignedAgency(e.target.value)}
                  >
                    <option value="NDRF">NDRF (Disaster Response Force)</option>
                    <option value="Ambulance 108">Ambulance 108 (Emergency Medical)</option>
                    <option value="Police 100">Police 100 (Public Safety & Security)</option>
                    <option value="Fire 101">Fire 101 (Search & Rescue / Extrication)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Specific Unit / Vehicle:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={assignedUnit}
                    onChange={(e) => setAssignedUnit(e.target.value)}
                    placeholder="e.g. NDRF Boat Unit 04"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responder Field Log Notes:</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={responderNotes}
                    onChange={(e) => setResponderNotes(e.target.value)}
                    placeholder="e.g. Unit deployed. Ingestion verified."
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating Dispatch..." : "Commit Dispatch Update"}
                </button>
              </form>
            </div>
          ) : (
            <div className="dashboard-card" style={{ padding: '24px', textAlign: 'center' }}>
              <ChevronRight size={32} className="text-muted" />
              <p className="text-muted">Select any incident from the list to assign emergency dispatch agencies or update triage lifecycle status.</p>
            </div>
          )}

          <div className="dashboard-card" style={{ padding: '16px', marginTop: '16px' }}>
            <div className="summary-row" style={{ marginBottom: '8px' }}>
              <h4>Tracked Emergency Fleet</h4>
              <span>{resources.length} Available</span>
            </div>

            <div>
              {resources.map((res) => (
                <div key={res.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="summary-row">
                    <span><strong>{res.name}</strong></span>
                    <span className="text-amber">{res.status}</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>{res.type} &bull; Cap: {res.capacity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showBroadcastModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title-row">
                <Radio className="text-red" size={24} />
                <h2>Broadcast Geo-fenced Civic Alert</h2>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowBroadcastModal(false)}
              >✕</button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="modal-body">
              <div className="form-group">
                <label className="form-label">Alert Headline:</label>
                <input
                  type="text"
                  className="form-input"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="e.g. Immediate Flood Evacuation Order - Sector 4"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level:</label>
                <select
                  className="form-select"
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value)}
                >
                  <option value="CRITICAL">CRITICAL (Immediate Danger / Evacuate)</option>
                  <option value="WARNING">WARNING (Severe Threat)</option>
                  <option value="ADVISORY">ADVISORY (General Notice)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category:</label>
                <select
                  className="form-select"
                  value={alertCategory}
                  onChange={(e) => setAlertCategory(e.target.value)}
                >
                  <option value="Flood Warning">Flood Warning</option>
                  <option value="Cyclone / Wind">Cyclone / Wind</option>
                  <option value="Earthquake Alert">Earthquake Alert</option>
                  <option value="Medical Relief">Medical Relief</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Zone / Geo-Fence:</label>
                <input
                  type="text"
                  className="form-input"
                  value={alertZone}
                  onChange={(e) => setAlertZone(e.target.value)}
                  placeholder="e.g. Lowland Riverfront (Radius 5 km)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Directive / Instructions:</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={alertDescription}
                  onChange={(e) => setAlertDescription(e.target.value)}
                  placeholder="Instruct residents on escape routes..."
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowBroadcastModal(false)}
                >Cancel</button>
                <button
                  type="submit"
                  className="btn-danger-large"
                  disabled={isBroadcasting}
                >
                  {isBroadcasting ? "Broadcasting..." : "Publish Civic Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
