import React, { useState, useEffect } from 'react';
import { 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MapPin, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw,
  Radio
} from 'lucide-react';
import { 
  getLocalSOSHistory, 
  clearAllLocalData, 
  processQueueSync,
  QUEUE_CHANGE_EVENT 
} from '../utils/offlineQueue';
import { formatCoordinates, copyCoordinatesToClipboard } from '../utils/location';

export default function SOSHistory({ isOnline, isSimulatedOffline }) {
  const [reports, setReports] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [filter, setFilter] = useState("all");

  const loadHistory = () => {
    const list = getLocalSOSHistory();
    setReports(list);
  };

  useEffect(() => {
    loadHistory();

    const handleQueueChange = () => {
      loadHistory();
    };

    window.addEventListener(QUEUE_CHANGE_EVENT, handleQueueChange);
    return () => window.removeEventListener(QUEUE_CHANGE_EVENT, handleQueueChange);
  }, []);

  const handleCopyReport = async (report) => {
    let text = `[ResQLink SOS REPORT]\nID: ${report.report_id}\nTime: ${report.timestamp}\nType: ${report.emergency_type}\nStatus: ${report.status}`;
    if (report.coordinates) {
      text += `\nGPS: ${formatCoordinates(report.coordinates.latitude, report.coordinates.longitude)} (Lat: ${report.coordinates.latitude}, Lng: ${report.coordinates.longitude})`;
    }
    if (report.message) {
      text += `\nNotes: ${report.message}`;
    }

    const res = await copyCoordinatesToClipboard(
      report.coordinates?.latitude || 0,
      report.coordinates?.longitude || 0,
      text
    );
    if (res.success) {
      setCopiedId(report.report_id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleManualSync = async () => {
    setIsRetrying(true);
    await processQueueSync({
      isSimulatedOffline
    });
    setIsRetrying(false);
    loadHistory();
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your local SOS report history on this device?")) {
      clearAllLocalData();
      loadHistory();
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "pending") return !r.server_acknowledged;
    if (filter === "acknowledged") return r.server_acknowledged;
    return true;
  });

  const pendingCount = reports.filter((r) => !r.server_acknowledged).length;
  const acknowledgedCount = reports.filter((r) => r.server_acknowledged).length;

  return (
    <div className="history-section">
      <div className="history-toolbar">
        <div className="history-title-row">
          <History size={22} className="inline-icon text-red" />
          <div>
            <h3>Local IndexedDB SOS Registry</h3>
            <p className="history-subtitle">
              All SOS alerts are stored on-device in IndexedDB and persist through phone reboots and offline periods.
            </p>
          </div>
        </div>

        <div className="history-actions-row">
          {pendingCount > 0 && (
            <button
              type="button"
              className="btn-sync-history"
              onClick={handleManualSync}
              disabled={isRetrying || (isSimulatedOffline || !isOnline)}
            >
              <RefreshCw size={15} className={isRetrying ? "animate-spin" : ""} />
              <span>{isRetrying ? "Syncing..." : `Retry Sync (${pendingCount})`}</span>
            </button>
          )}

          {reports.length > 0 && (
            <button
              type="button"
              className="btn-clear-history"
              onClick={handleClearHistory}
            >
              <Trash2 size={15} />
              <span>Clear Local</span>
            </button>
          )}
        </div>
      </div>

      <div className="history-filters-bar">
        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-btn ${filter === 'all' ? 'filter-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Reports ({reports.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'pending' ? 'filter-active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Offline Queued ({pendingCount})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'acknowledged' ? 'filter-active' : ''}`}
            onClick={() => setFilter('acknowledged')}
          >
            Server Acknowledged ({acknowledgedCount})
          </button>
        </div>
      </div>

      <div className="history-cards-container">
        {filteredReports.length === 0 ? (
          <div className="history-empty-state">
            <Radio size={48} className="empty-icon" />
            <h4>No SOS Reports in Local Registry</h4>
            <p>
              When an SOS alert is triggered or relayed from a peer phone, it will immediately appear here.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isAck = report.server_acknowledged;
            const isCopied = copiedId === report.report_id;

            return (
              <div 
                key={report.report_id} 
                className={`history-card ${isAck ? 'card-ack' : 'card-queued'}`}
              >
                <div className="card-top-row">
                  <div className="card-id-block">
                    <span className="label-report-id">ID:</span>
                    <code className="code-id">{report.report_id}</code>
                    {report.relayed_by_peer && (
                      <span className="relay-tag">Relayed via WebRTC Mesh</span>
                    )}
                  </div>
                  <div className="card-badge-status">
                    {isAck ? (
                      <span className="badge-ack">
                        <CheckCircle2 size={14} className="inline-icon" /> Server Acknowledged
                      </span>
                    ) : (
                      <span className="badge-queued">
                        <Clock size={14} className="inline-icon" /> Queued Offline (IndexedDB)
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-main-content">
                  <h4 className="report-emergency-heading">{report.emergency_type}</h4>
                  
                  {report.message && (
                    <p className="report-message-snippet">
                      <strong>Details:</strong> {report.message}
                    </p>
                  )}

                  <div className="report-meta-grid">
                    <div className="meta-item">
                      <Clock size={14} className="inline-icon text-muted" />
                      <span>Triggered: {new Date(report.timestamp).toLocaleString()}</span>
                    </div>

                    {report.coordinates ? (
                      <div className="meta-item">
                        <MapPin size={14} className="inline-icon text-red" />
                        <span>
                          {formatCoordinates(report.coordinates.latitude, report.coordinates.longitude)}
                        </span>
                      </div>
                    ) : (
                      <div className="meta-item text-muted">
                        <MapPin size={14} className="inline-icon text-muted" />
                        <span>No GPS coordinates</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-bottom-actions">
                  <button
                    type="button"
                    className="btn-card-action"
                    onClick={() => handleCopyReport(report)}
                  >
                    {isCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    <span>{isCopied ? "Copied to Clipboard!" : "Copy Full Report (SMS/Radio)"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
