const DB_NAME = "ResQLink_IDB_v2";
const DB_VERSION = 1;

export const STORES = {
  PENDING_SOS: "pending_sos_queue",
  SOS_HISTORY: "sos_history",
  ALERTS: "disaster_alerts",
  RELAY_BUFFER: "p2p_relay_buffer"
};

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORES.PENDING_SOS)) {
          db.createObjectStore(STORES.PENDING_SOS, { keyPath: "report_id" });
        }
        if (!db.objectStoreNames.contains(STORES.SOS_HISTORY)) {
          db.createObjectStore(STORES.SOS_HISTORY, { keyPath: "report_id" });
        }
        if (!db.objectStoreNames.contains(STORES.ALERTS)) {
          db.createObjectStore(STORES.ALERTS, { keyPath: "alert_id" });
        }
        if (!db.objectStoreNames.contains(STORES.RELAY_BUFFER)) {
          db.createObjectStore(STORES.RELAY_BUFFER, { keyPath: "report_id" });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
}

export async function idbSaveItem(storeName, item, idKey = "report_id") {
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(item);
    } catch (e) {}
  }

  try {
    const lsKey = `resqlink_${storeName}`;
    const raw = localStorage.getItem(lsKey);
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((i) => i[idKey] === item[idKey]);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(lsKey, JSON.stringify(list));
  } catch (err) {}
}

export async function idbGetAll(storeName) {
  const db = await openDB();
  if (db) {
    try {
      return await new Promise((resolve) => {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {}
  }

  try {
    const lsKey = `resqlink_${storeName}`;
    const raw = localStorage.getItem(lsKey);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export async function idbDeleteItem(storeName, id, idKey = "report_id") {
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(id);
    } catch (e) {}
  }

  try {
    const lsKey = `resqlink_${storeName}`;
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      const list = JSON.parse(raw);
      const filtered = list.filter((i) => i[idKey] !== id);
      localStorage.setItem(lsKey, JSON.stringify(filtered));
    }
  } catch (err) {}
}
