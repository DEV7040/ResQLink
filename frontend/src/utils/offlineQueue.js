import { idbSaveItem, idbGetAll, idbDeleteItem, STORES } from "./indexedDB";
import { flushPeerReportsToBackend } from "./p2pRelay";
import { getDeviceBattery, triggerVibration } from "./deviceApis";

const STORAGE_KEY_PENDING = "resqlink_pending_queue_v1";
const STORAGE_KEY_HISTORY = "resqlink_sos_history_v1";
const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

export const QUEUE_CHANGE_EVENT = "resqlink:queue_changed";
export const SYNC_STATUS_EVENT = "resqlink:sync_status";

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {}
}

function notifyQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(QUEUE_CHANGE_EVENT));
  }
}

export function generateReportId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SOS-${timestamp}-${random}`;
}

export async function saveSOSLocally(reportData) {
  const reportId = reportData.report_id || generateReportId();
  const timestamp = reportData.timestamp || new Date().toISOString();

  triggerVibration("sos");

  let batteryInfo = null;
  try {
    batteryInfo = await getDeviceBattery();
  } catch (e) {}

  const fullReport = {
    report_id: reportId,
    timestamp,
    emergency_type: reportData.emergency_type || "General Emergency",
    message: reportData.message || "",
    coordinates: reportData.coordinates || null,
    status: "QUEUED_OFFLINE",
    server_acknowledged: false,
    server_received_at: null,
    client_created_at: timestamp,
    responder_status: "PENDING",
    device_info: {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      battery: batteryInfo,
      vibrationUsed: true
    }
  };

  await idbSaveItem(STORES.PENDING_SOS, fullReport, "report_id");
  await idbSaveItem(STORES.SOS_HISTORY, fullReport, "report_id");

  const pending = readStorage(STORAGE_KEY_PENDING);
  if (!pending.some((r) => r.report_id === reportId)) {
    pending.unshift(fullReport);
    writeStorage(STORAGE_KEY_PENDING, pending);
  }

  const history = readStorage(STORAGE_KEY_HISTORY);
  const existingHistIdx = history.findIndex((r) => r.report_id === reportId);
  if (existingHistIdx >= 0) {
    history[existingHistIdx] = fullReport;
  } else {
    history.unshift(fullReport);
  }
  writeStorage(STORAGE_KEY_HISTORY, history);

  notifyQueueChanged();
  return fullReport;
}

export function getLocalSOSHistory() {
  return readStorage(STORAGE_KEY_HISTORY);
}

export function getPendingQueueCount() {
  return readStorage(STORAGE_KEY_PENDING).length;
}

export function getPendingQueue() {
  return readStorage(STORAGE_KEY_PENDING);
}

export function clearAllLocalData() {
  localStorage.removeItem(STORAGE_KEY_PENDING);
  localStorage.removeItem(STORAGE_KEY_HISTORY);
  notifyQueueChanged();
}

let isSyncInProgress = false;

export async function processQueueSync(options = {}) {
  const {
    backendUrl = DEFAULT_BACKEND_URL,
    isSimulatedOffline = false,
    onProgress = null
  } = options;

  if (isSyncInProgress) {
    return { synced: 0, pending: getPendingQueueCount(), message: "Sync already in progress" };
  }

  if (isSimulatedOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return {
      synced: 0,
      pending: getPendingQueueCount(),
      offline: true,
      message: "Device is offline. Reports safely preserved in local queue."
    };
  }

  try {
    await flushPeerReportsToBackend(backendUrl);
  } catch (e) {}

  const pending = readStorage(STORAGE_KEY_PENDING);
  if (pending.length === 0) {
    return { synced: 0, pending: 0, message: "No pending reports to sync." };
  }

  isSyncInProgress = true;
  let syncedCount = 0;
  const remainingPending = [];
  const history = readStorage(STORAGE_KEY_HISTORY);

  try {
    for (const report of pending) {
      if (onProgress) onProgress(report.report_id, "SENDING");

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(`${backendUrl}/sos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(report),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const resData = await response.json();
          syncedCount++;

          const updatedRecord = {
            ...report,
            status: "SERVER_ACKNOWLEDGED",
            server_acknowledged: true,
            server_received_at: resData.server_received_at || new Date().toISOString(),
            server_note: resData.message
          };

          await idbDeleteItem(STORES.PENDING_SOS, report.report_id, "report_id");
          await idbSaveItem(STORES.SOS_HISTORY, updatedRecord, "report_id");

          const histIdx = history.findIndex((h) => h.report_id === report.report_id);
          if (histIdx >= 0) {
            history[histIdx] = updatedRecord;
          } else {
            history.unshift(updatedRecord);
          }
        } else {
          remainingPending.push(report);
        }
      } catch (networkErr) {
        remainingPending.push(report);
      }
    }

    writeStorage(STORAGE_KEY_PENDING, remainingPending);
    writeStorage(STORAGE_KEY_HISTORY, history);
    notifyQueueChanged();

    return {
      synced: syncedCount,
      pending: remainingPending.length,
      success: remainingPending.length === 0,
      message: `Synchronized ${syncedCount} SOS report(s). ${remainingPending.length} remaining in queue.`
    };
  } finally {
    isSyncInProgress = false;
  }
}

export async function checkBackendHealth(backendUrl = DEFAULT_BACKEND_URL) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${backendUrl}/health`, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { reachable: true, data };
    }
    return { reachable: false, error: `HTTP ${response.status}` };
  } catch (err) {
    return { reachable: false, error: err.name === "AbortError" ? "Timeout" : "Connection Refused / Offline" };
  }
}
