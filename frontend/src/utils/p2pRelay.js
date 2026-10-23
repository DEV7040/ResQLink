import { idbGetAll, idbSaveItem, idbDeleteItem, STORES } from "./indexedDB";

const P2P_RELAY_EVENT = "resqlink:p2p_relay_updated";

export function generatePeerId() {
  return `PEER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function notifyP2PChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(P2P_RELAY_EVENT));
  }
}

export async function createP2PRelayPacket(myPeerId) {
  const pending = await idbGetAll(STORES.PENDING_SOS);
  if (!pending || pending.length === 0) {
    return null;
  }

  const packet = {
    protocol: "RESQLINK_P2P_V1",
    origin_peer_id: myPeerId || generatePeerId(),
    created_at: new Date().toISOString(),
    hop_count: 1,
    reports: pending.map((r) => ({
      ...r,
      relayed_by_peer: true,
      peer_hop_count: (r.peer_hop_count || 0) + 1
    }))
  };

  return packet;
}

export async function ingestPeerRelayPacket(packetJson) {
  let packet = packetJson;
  if (typeof packetJson === "string") {
    try {
      packet = JSON.parse(packetJson);
    } catch (e) {
      return { success: false, error: "Invalid P2P JSON packet" };
    }
  }

  if (!packet || !packet.reports || !Array.isArray(packet.reports)) {
    return { success: false, error: "Malformed P2P packet schema" };
  }

  let count = 0;
  for (const report of packet.reports) {
    await idbSaveItem(STORES.RELAY_BUFFER, report, "report_id");
    count++;
  }

  notifyP2PChanged();
  return {
    success: true,
    relayed_from: packet.origin_peer_id,
    reports_buffered: count
  };
}

export async function getBufferedPeerReports() {
  return await idbGetAll(STORES.RELAY_BUFFER);
}

export async function flushPeerReportsToBackend(backendUrl = "http://127.0.0.1:8000") {
  const buffered = await idbGetAll(STORES.RELAY_BUFFER);
  if (!buffered || buffered.length === 0) {
    return { count: 0, message: "No buffered peer reports to flush" };
  }

  try {
    const payload = {
      relaying_peer_id: generatePeerId(),
      reports: buffered
    };

    const res = await fetch(`${backendUrl}/sos/relay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      for (const r of buffered) {
        await idbDeleteItem(STORES.RELAY_BUFFER, r.report_id, "report_id");
      }
      notifyP2PChanged();
      return {
        success: true,
        count: buffered.length,
        data
      };
    }
    return { success: false, error: `HTTP ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
