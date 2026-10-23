import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  ArrowRight, 
  Copy, 
  Check, 
  AlertTriangle,
  X
} from 'lucide-react';
import { 
  createP2PRelayPacket, 
  ingestPeerRelayPacket, 
  getBufferedPeerReports, 
  flushPeerReportsToBackend, 
  generatePeerId 
} from '../utils/p2pRelay';

export default function MeshRelayModal({ isOpen, onClose, isOnline, isSimulatedOffline, onRelayComplete }) {
  const [myPeerId, setMyPeerId] = useState("");
  const [generatedPacket, setGeneratedPacket] = useState(null);
  const [inputPacket, setInputPacket] = useState("");
  const [bufferedReports, setBufferedReports] = useState([]);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isFlushing, setIsFlushing] = useState(false);

  useEffect(() => {
    setMyPeerId(generatePeerId());
    loadBuffered();
  }, []);

  const loadBuffered = async () => {
    const list = await getBufferedPeerReports();
    setBufferedReports(list || []);
  };

  const handleCreatePacket = async () => {
    const packet = await createP2PRelayPacket(myPeerId);
    if (!packet) {
      setStatusMessage({ type: "warn", text: "No pending local SOS reports to relay. Trigger an SOS in offline mode first!" });
      return;
    }
    setGeneratedPacket(JSON.stringify(packet, null, 2));
    setStatusMessage({ type: "success", text: `WebRTC Relay Packet generated (${packet.reports.length} SOS report) ready to hop!` });
  };

  const handleCopyPacket = async () => {
    if (!generatedPacket) return;
    try {
      await navigator.clipboard.writeText(generatedPacket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {}
  };

  const handleIngestPacket = async () => {
    if (!inputPacket.trim()) return;
    const res = await ingestPeerRelayPacket(inputPacket);
    if (res.success) {
      setStatusMessage({ 
        type: "success", 
        text: `Success! Received ${res.reports_buffered} SOS report(s) from Phone (${res.relayed_from}). Stored in relay buffer!` 
      });
      setInputPacket("");
      await loadBuffered();
      if (onRelayComplete) onRelayComplete();
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed ingesting P2P packet." });
    }
  };

  const handleSimulateJudgeDemo = async () => {
    const demoPacket = {
      protocol: "RESQLINK_P2P_V1",
      origin_peer_id: "PHONE-A-OFFLINE",
      created_at: new Date().toISOString(),
      hop_count: 1,
      reports: [
        {
          report_id: `SOS-P2P-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          emergency_type: "Flood / Water Trap (Phone A)",
          message: "Relayed from isolated Sector 4 rooftop. 3 people stranded with low battery.",
          coordinates: { latitude: 28.6185, longitude: 77.2140, accuracy: 6.0 },
          status: "QUEUED_OFFLINE",
          relayed_by_peer: true,
          peer_hop_count: 1
        }
      ]
    };

    await ingestPeerRelayPacket(demoPacket);
    await loadBuffered();
    setStatusMessage({
      type: "success",
      text: "Simulated WebRTC Hop from Phone A -> Phone B! Now click 'Sync Buffered Reports to Backend' to transmit to Responder Dashboard."
    });
  };

  const handleFlushToCloud = async () => {
    setIsFlushing(true);
    const effectiveOnline = isOnline && !isSimulatedOffline;
    if (!effectiveOnline) {
      setStatusMessage({ type: "warn", text: "Device is still in Offline/Airplane mode. Reconnect to sync buffered peer reports." });
      setIsFlushing(false);
      return;
    }

    const res = await flushPeerReportsToBackend();
    setIsFlushing(false);
    if (res.success) {
      setStatusMessage({ 
        type: "success", 
        text: `Flushed ${res.count} relayed SOS reports to Cloud Backend! Inspect the Responder Dashboard.` 
      });
      await loadBuffered();
      if (onRelayComplete) onRelayComplete();
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to flush reports to server." });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Radio className="text-red" size={24} />
            <h2>WebRTC Phone-to-Phone Mesh Relay</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="mesh-diagram-banner">
            <div>
              <Smartphone size={24} className="text-red" />
              <div style={{ fontSize: '0.7rem' }}>Phone A<br/>(No Signal)</div>
            </div>
            <ArrowRight size={20} className="text-muted" />
            <div>
              <Radio size={24} className="text-amber" />
              <div style={{ fontSize: '0.7rem' }}>WebRTC Hop<br/>(P2P Data)</div>
            </div>
            <ArrowRight size={20} className="text-muted" />
            <div>
              <Smartphone size={24} className="text-success" />
              <div style={{ fontSize: '0.7rem' }}>Phone B<br/>(Relay Peer)</div>
            </div>
            <ArrowRight size={20} className="text-muted" />
            <div>
              <UploadCloud size={24} className="text-muted" />
              <div style={{ fontSize: '0.7rem' }}>Cloud EOC<br/>(Backend)</div>
            </div>
          </div>

          <div className="judge-demo-bar">
            <span><strong>Hackathon Live Demo Shortcut:</strong></span>
            <button 
              type="button" 
              className="btn-judge-test"
              onClick={handleSimulateJudgeDemo}
            >
              Simulate 1-Click Hop (Phone A &rarr; Phone B)
            </button>
          </div>

          {statusMessage && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {statusMessage.type === "success" ? <CheckCircle2 size={16} className="text-success" /> : <AlertTriangle size={16} className="text-red" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="relay-actions-grid">
            <div className="relay-box">
              <h4>1. Send SOS via P2P (Phone A)</h4>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>Package your offline reports for nearby phones.</p>
              <button 
                type="button" 
                className="btn-toolbar w-full"
                onClick={handleCreatePacket}
              >
                Generate P2P Relay Packet
              </button>

              {generatedPacket && (
                <div style={{ marginTop: '8px' }}>
                  <div className="summary-row" style={{ fontSize: '0.7rem' }}>
                    <span>Relay Payload:</span>
                    <button type="button" className="btn-toolbar" style={{ padding: '2px 6px' }} onClick={handleCopyPacket}>
                      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '0.65rem', backgroundColor: '#090d16', padding: '6px', borderRadius: '4px' }}>{generatedPacket}</pre>
                </div>
              )}
            </div>

            <div className="relay-box">
              <h4>2. Receive from Phone A (Phone B)</h4>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>Paste packet received from isolated phone.</p>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Paste P2P packet JSON here..."
                value={inputPacket}
                onChange={(e) => setInputPacket(e.target.value)}
              />
              <button 
                type="button" 
                className="btn-secondary w-full"
                onClick={handleIngestPacket}
                disabled={!inputPacket.trim()}
              >
                Ingest Peer Packet
              </button>
            </div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
              <Clock size={16} className="text-amber" />
              <span><strong>Phone B Buffer:</strong> {bufferedReports.length} peer report(s) waiting for cellular sync</span>
            </div>
            {bufferedReports.length > 0 && (
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleFlushToCloud}
                disabled={isFlushing}
              >
                <UploadCloud size={16} />
                <span>{isFlushing ? "Flushing..." : "Sync to Backend"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close Relay Window
          </button>
        </div>
      </div>
    </div>
  );
}
