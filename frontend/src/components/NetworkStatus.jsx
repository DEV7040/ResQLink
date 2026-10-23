import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Server, 
  ServerOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  HardDriveDownload,
  Clock
} from 'lucide-react';

export default function NetworkStatus({
  isOnline,
  isSimulatedOffline,
  backendHealth,
  pendingCount,
  onSyncNow,
  isSyncing,
  lastSyncTime
}) {
  const effectiveOnline = isOnline && !isSimulatedOffline;
  const isServerReachable = effectiveOnline && backendHealth?.reachable;

  return (
    <div className="network-status-panel">
      <div className="network-grid">
        <div className={`network-stat-card ${effectiveOnline ? 'stat-good' : 'stat-warn'}`}>
          <div className="stat-icon-col">
            {effectiveOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div className="stat-content-col">
            <span className="stat-label">Browser Network</span>
            <span className="stat-val">
              {isSimulatedOffline ? 'Simulated Offline (Airplane Mode)' : effectiveOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>

        <div className={`network-stat-card ${isServerReachable ? 'stat-good' : 'stat-warn'}`}>
          <div className="stat-icon-col">
            {isServerReachable ? <Server size={20} /> : <ServerOff size={20} />}
          </div>
          <div className="stat-content-col">
            <span className="stat-label">FastAPI Backend (8000)</span>
            <span className="stat-val">
              {isServerReachable 
                ? `Online (${backendHealth.data?.storage?.total_records || 0} reports)` 
                : effectiveOnline ? 'Server Unreachable' : 'Offline'}
            </span>
          </div>
        </div>

        <div className={`network-stat-card ${pendingCount > 0 ? 'stat-alert' : 'stat-good'}`}>
          <div className="stat-icon-col">
            {pendingCount > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div className="stat-content-col">
            <span className="stat-label">Offline SOS Queue (IndexedDB)</span>
            <span className="stat-val">
              {pendingCount > 0 ? `${pendingCount} Pending Sync` : 'All Synced'}
            </span>
          </div>
        </div>

        <div className="network-sync-col">
          <button
            type="button"
            className="sync-action-btn"
            onClick={onSyncNow}
            disabled={isSyncing || (!effectiveOnline && pendingCount === 0)}
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Syncing..." : pendingCount > 0 ? `Sync (${pendingCount})` : "Check Sync"}</span>
          </button>
          {lastSyncTime && (
            <span className="last-sync-caption">
              <Clock size={11} className="inline-icon" /> Last check: {lastSyncTime}
            </span>
          )}
        </div>
      </div>

      <div className="offline-guarantee-strip">
        <HardDriveDownload size={14} className="inline-icon" />
        <span>
          <strong>Zero Hardware Required:</strong> Everything runs on-device via IndexedDB & Service Worker. SOS messages queue offline and sync automatically upon reconnection.
        </span>
      </div>
    </div>
  );
}
