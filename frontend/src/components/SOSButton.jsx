import React, { useState } from 'react';
import { 
  AlertOctagon, 
  MapPin, 
  Users, 
  FileText, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  X,
  Compass
} from 'lucide-react';
import { getGPSLocation, formatCoordinates } from '../utils/location';
import { saveSOSLocally, processQueueSync } from '../utils/offlineQueue';

function playSOSSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playBeep = (freq, duration, delay) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      }, delay);
    };

    playBeep(880, 0.15, 0);
    playBeep(880, 0.15, 200);
    playBeep(1100, 0.25, 450);
  } catch (err) {}
}

export default function SOSButton({ 
  isOnline, 
  isSimulatedOffline, 
  onSOSCreated,
  preselectedEmergency = null,
  triggerDirectSOS = null
}) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [emergencyType, setEmergencyType] = useState(preselectedEmergency || "General Emergency");
  const [victimCount, setVictimCount] = useState("1 person");
  const [details, setDetails] = useState("");
  const [includeLocation, setIncludeLocation] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  const emergencyOptions = [
    { type: "General Emergency", desc: "Life safety danger / stranded" },
    { type: "Medical Trauma", desc: "Severe injury, unconscious, bleeding" },
    { type: "Flood / Water Trap", desc: "Rising water, rooftop stranded" },
    { type: "Structural Collapse", desc: "Trapped under debris / rubble" },
    { type: "Fire / Smoke Trapped", desc: "Blocked exit, smoke inhalation" }
  ];

  const handleOpenModal = () => {
    setIsOpenModal(true);
  };

  const handleTriggerSOS = async () => {
    setIsSubmitting(true);

    if (soundEnabled) {
      playSOSSound();
    }

    let coords = null;
    let locationWarning = null;

    if (includeLocation) {
      const locResult = await getGPSLocation({ timeout: 8000 });
      if (locResult.success && locResult.coordinates) {
        coords = locResult.coordinates;
      } else {
        locationWarning = locResult.error || "Coordinates could not be acquired.";
      }
    }

    const messageText = `Victims: ${victimCount}. ${details ? `Details: ${details}` : ''}`.trim();

    const savedLocal = await saveSOSLocally({
      emergency_type: emergencyType,
      message: messageText,
      coordinates: coords
    });

    const effectiveOnline = isOnline && !isSimulatedOffline;
    let syncResult = null;

    if (effectiveOnline) {
      syncResult = await processQueueSync({
        isSimulatedOffline: false
      });
    }

    setIsSubmitting(false);
    setIsOpenModal(false);

    setResultModal({
      reportId: savedLocal.report_id,
      timestamp: savedLocal.timestamp,
      emergencyType: savedLocal.emergency_type,
      coordinates: coords,
      locationWarning,
      isAcknowledged: syncResult?.synced > 0,
      offlineStored: true
    });

    if (onSOSCreated) {
      onSOSCreated();
    }
  };

  // Expose triggerDirectSOS (e.g. from Shake detection)
  React.useEffect(() => {
    if (triggerDirectSOS && typeof triggerDirectSOS === "function") {
      triggerDirectSOS(handleTriggerSOS);
    }
  }, [triggerDirectSOS, emergencyType, victimCount, details, includeLocation, soundEnabled, isOnline, isSimulatedOffline]);

  return (
    <div className="sos-section">
      <div className="sos-container">
        <button
          type="button"
          className="sos-master-button"
          onClick={handleOpenModal}
          aria-label="Trigger Emergency SOS"
        >
          <div className="sos-glow-ring"></div>
          <div className="sos-inner-circle">
            <AlertOctagon size={48} className="sos-icon" />
            <span className="sos-main-text">EMERGENCY SOS</span>
            <span className="sos-sub-text">TAP TO ACTIVATE</span>
          </div>
        </button>

        <p className="sos-caption">
          Saves immediately to local IndexedDB. Works in Airplane mode. Hops over WebRTC mesh or syncs when signal returns.
        </p>
      </div>

      {isOpenModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title-row">
                <AlertTriangle className="alert-badge-icon" size={24} />
                <h2>Broadcast Emergency SOS</h2>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setIsOpenModal(false)}
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Type of Crisis / Hazard:</label>
                <div className="emergency-type-grid">
                  {emergencyOptions.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      className={`type-select-btn ${emergencyType === opt.type ? 'type-selected' : ''}`}
                      onClick={() => setEmergencyType(opt.type)}
                      disabled={isSubmitting}
                    >
                      <span className="type-title">{opt.type}</span>
                      <span className="type-desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Users size={16} className="inline-icon" /> Estimated Persons in Danger:
                </label>
                <div className="people-toggle-row">
                  {["1 person", "2 - 3 people", "4 - 8 people", "8+ crowd"].map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={`pill-btn ${victimCount === count ? 'pill-active' : ''}`}
                      onClick={() => setVictimCount(count)}
                      disabled={isSubmitting}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeLocation}
                    onChange={(e) => setIncludeLocation(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>
                    <Compass size={16} className="inline-icon" /> Attach GPS Coordinates (Satellite sensor, no internet needed)
                  </span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FileText size={16} className="inline-icon" /> Specific Location / Landmark Notes:
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. 2nd floor balcony, water at waist level, elderly person needs stretcher"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="sound-toggle-row">
                <button
                  type="button"
                  className="text-link-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>{soundEnabled ? "Audio & Vibration Alert Enabled" : "Silent Mode"}</span>
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsOpenModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-large"
                onClick={handleTriggerSOS}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Acquiring GPS & Saving..." : "CONFIRM & TRANSMIT SOS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {resultModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog result-dialog">
            <div className="modal-header">
              <div className="modal-title-row">
                {resultModal.isAcknowledged ? (
                  <CheckCircle2 className="success-icon" size={28} />
                ) : (
                  <Clock className="warning-icon" size={28} />
                )}
                <h2>
                  {resultModal.isAcknowledged 
                    ? "SOS Acknowledged by Backend" 
                    : "SOS Saved to Local Offline Queue"}
                </h2>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setResultModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="report-summary-box">
                <div className="summary-row">
                  <span className="sum-label">Report ID:</span>
                  <code className="sum-code">{resultModal.reportId}</code>
                </div>
                <div className="summary-row">
                  <span className="sum-label">Emergency:</span>
                  <span className="sum-val font-bold">{resultModal.emergencyType}</span>
                </div>
                <div className="summary-row">
                  <span className="sum-label">Local Save:</span>
                  <span className="sum-val text-success">Saved to Device IndexedDB</span>
                </div>
                <div className="summary-row">
                  <span className="sum-label">Server Status:</span>
                  <span className={`sum-val ${resultModal.isAcknowledged ? 'text-success' : 'text-amber'}`}>
                    {resultModal.isAcknowledged 
                      ? 'Acknowledged by FastAPI Backend' 
                      : 'Preserved in Offline Queue. Relays over WebRTC mesh or auto-syncs when online.'}
                  </span>
                </div>
                {resultModal.coordinates && (
                  <div className="summary-row">
                    <span className="sum-label">Coordinates:</span>
                    <span className="sum-val">
                      {formatCoordinates(resultModal.coordinates.latitude, resultModal.coordinates.longitude)}
                    </span>
                  </div>
                )}
              </div>

              <div className="critical-notice-banner">
                <AlertTriangle size={18} className="notice-icon" />
                <p>
                  <strong>CRITICAL DISCLAIMER:</strong> Backend acknowledgment stores your report on the prototype server. In real active disasters, also attempt cellular emergency calls (<strong>112 / 911</strong>).
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setResultModal(null)}
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
