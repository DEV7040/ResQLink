import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  RefreshCw, 
  MapPin, 
  Clock, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import { idbGetAll, idbSaveItem, STORES } from '../utils/indexedDB';

const DEFAULT_ALERTS = [
  {
    alert_id: "ALT-2026-001",
    title: "Severe Flash Flood Warning & Evacuation Alert",
    severity: "CRITICAL",
    category: "Flood Warning",
    description: "River embankment breached near Low-Lying Sector 4. High water levels rising rapidly. Residents are ordered to evacuate to designated high-ground relief centers immediately.",
    geo_fence: "Sector 4 & Riverfront Basin (Radius 5 km)",
    issued_by: "National Disaster Management Authority (NDMA)",
    issued_at: "2026-10-22T10:30:00Z",
    active: true
  },
  {
    alert_id: "ALT-2026-002",
    title: "Severe Cyclonic Weather & Wind Advisory",
    severity: "WARNING",
    category: "Cyclone / Wind",
    description: "Gale-force gusts exceeding 95 km/h predicted over next 6 hours. Stay indoors, secure loose rooftop objects, avoid standing near glass facades or live power cables.",
    geo_fence: "Coastal & Delta Zones",
    issued_by: "State Emergency Operation Center (SEOC)",
    issued_at: "2026-10-22T12:00:00Z",
    active: true
  },
  {
    alert_id: "ALT-2026-003",
    title: "Mobile Drinking Water & Medical Staging Ready",
    severity: "ADVISORY",
    category: "Relief Operations",
    description: "NDRF Medical Post Beta and Mobile Water Tankers are operational at Community Ground Alpha. Clean water distribution and trauma stabilization available.",
    geo_fence: "Central Relief Sector",
    issued_by: "District Collectorate Relief Cell",
    issued_at: "2026-10-22T14:15:00Z",
    active: true
  }
];

export default function AlertsFeed({ isOnline, isSimulatedOffline }) {
  const [alerts, setAlerts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("all");

  const effectiveOnline = isOnline && !isSimulatedOffline;

  const loadAlerts = async () => {
    const cached = await idbGetAll(STORES.ALERTS);
    if (cached && cached.length > 0) {
      setAlerts(cached);
    } else {
      setAlerts(DEFAULT_ALERTS);
      for (const a of DEFAULT_ALERTS) {
        await idbSaveItem(STORES.ALERTS, a, "alert_id");
      }
    }

    if (effectiveOnline) {
      try {
        setIsRefreshing(true);
        const res = await fetch("http://127.0.0.1:8000/alerts");
        if (res.ok) {
          const data = await res.json();
          if (data.alerts && data.alerts.length > 0) {
            setAlerts(data.alerts);
            for (const a of data.alerts) {
              await idbSaveItem(STORES.ALERTS, a, "alert_id");
            }
          }
        }
      } catch (err) {
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [effectiveOnline]);

  const filteredAlerts = alerts.filter(
    (a) => filterSeverity === "all" || a.severity === filterSeverity
  );

  return (
    <div className="alerts-feed-section">
      <div className="alerts-feed-header">
        <div className="alerts-title-row">
          <div className="alerts-icon-badge">
            <Radio size={24} className="text-red animate-pulse" />
          </div>
          <div>
            <h3>Civic Disaster Alerts & Broadcasts</h3>
            <p className="alerts-subtitle">
              Pushed from Cloud Alert Engine & cached in IndexedDB for 100% offline access.
            </p>
          </div>
        </div>

        <div className="alerts-header-actions">
          <button
            type="button"
            className="btn-toolbar"
            onClick={loadAlerts}
            disabled={isRefreshing || !effectiveOnline}
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Refreshing..." : effectiveOnline ? "Check Alerts" : "Cached Offline"}</span>
          </button>
        </div>
      </div>

      <div className="alerts-filter-row">
        {[
          { id: "all", label: `All Alerts (${alerts.length})` },
          { id: "CRITICAL", label: "Critical Evacuation" },
          { id: "WARNING", label: "Warnings" },
          { id: "ADVISORY", label: "Advisories" }
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            className={`btn-toolbar ${filterSeverity === f.id ? 'btn-primary' : ''}`}
            onClick={() => setFilterSeverity(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="alerts-empty-card">
            <CheckCircle2 size={36} className="text-success" />
            <h4>No Active Alerts in this Category</h4>
            <p>Civic authorities have not broadcast any active advisories for this filter.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL";
            const isWarning = alert.severity === "WARNING";

            return (
              <div
                key={alert.alert_id}
                className={`alert-card ${
                  isCritical ? 'alert-critical' : isWarning ? 'alert-warning' : 'alert-advisory'
                }`}
              >
                <div className="alert-card-top">
                  <span className="font-bold">{alert.severity} &bull; {alert.category}</span>
                  <span className="text-muted">
                    <Clock size={13} className="inline-icon" /> {new Date(alert.issued_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="alert-headline">{alert.title}</h4>
                <p className="text-muted">{alert.description}</p>

                <div className="alert-footer-meta">
                  <span><strong>Zone:</strong> {alert.geo_fence || "All Affected Sectors"}</span>
                  <span><strong>Issued by:</strong> {alert.issued_by || "Disaster Operations"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
