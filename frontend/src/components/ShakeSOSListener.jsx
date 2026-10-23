import React, { useState, useEffect, useRef } from 'react';
import { 
  Vibrate, 
  Smartphone, 
  Check, 
  AlertTriangle, 
  Settings2,
  X,
  Radio
} from 'lucide-react';
import { shakeDetector } from '../utils/shakeDetection';
import { triggerVibration } from '../utils/deviceApis';

export default function ShakeSOSListener({ onTriggerShakeSOS, isEnabled, onToggleEnabled }) {
  const [countdown, setCountdown] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [motionSupported, setMotionSupported] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    setMotionSupported(shakeDetector.isSupported());
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      shakeDetector.stop();
      return;
    }

    const handleDetectedShake = () => {
      // Don't re-trigger if countdown is already active
      if (countdown !== null) return;

      // Haptic feedback to alert user shake was recognized
      triggerVibration("pulse");

      // Start 5-second cancelable countdown
      setCountdown(5);
      setShowNotification(true);
    };

    const started = shakeDetector.start(handleDetectedShake);
    if (!started && !shakeDetector.isSupported()) {
      setMotionSupported(false);
    }

    return () => {
      shakeDetector.stop();
    };
  }, [isEnabled, countdown]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      // Countdown finished -> fire SOS
      setCountdown(null);
      setShowNotification(false);
      triggerVibration("sos");
      onTriggerShakeSOS();
      return;
    }

    timerRef.current = setTimeout(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown, onTriggerShakeSOS]);

  const handleCancelCountdown = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(null);
    setShowNotification(false);
  };

  const handleManualTestShake = () => {
    if (countdown !== null) return;
    triggerVibration("pulse");
    setCountdown(5);
    setShowNotification(true);
  };

  return (
    <>
      {/* Active Shake Countdown Modal / Overlay */}
      {showNotification && countdown !== null && (
        <div className="modal-backdrop shake-alert-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-dialog shake-alert-card animate-bounce-subtle" style={{ maxWidth: '440px', border: '2px solid var(--red-500)', boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)' }}>
            <div className="modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="modal-title-row">
                <Smartphone className="text-red animate-pulse" size={28} />
                <h2 style={{ color: 'var(--red-500)', fontSize: '1.25rem' }}>
                  Shake Gesture Detected!
                </h2>
              </div>
            </div>

            <div className="modal-body text-center" style={{ padding: '24px 16px' }}>
              <p style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '12px' }}>
                Emergency SOS will trigger automatically in:
              </p>

              <div className="shake-countdown-circle" style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '3px solid var(--red-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                fontSize: '2.5rem',
                fontWeight: '900',
                color: 'var(--red-500)'
              }}>
                {countdown}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Accidental shake? Tap Cancel immediately to abort.
              </p>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelCountdown}
                style={{ padding: '10px 20px', fontWeight: 'bold' }}
              >
                Cancel / False Alarm
              </button>
              <button
                type="button"
                className="btn-danger-large"
                onClick={() => {
                  setCountdown(0);
                }}
                style={{ padding: '10px 20px', minWidth: 'auto', fontSize: '0.9rem' }}
              >
                Send SOS Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shake Control / Status Badge widget */}
      <div className="shake-banner-card" style={{
        margin: '0 0 16px 0',
        padding: '12px 16px',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: isEnabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Smartphone size={20} className={isEnabled ? "text-red" : "text-muted"} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Moto-Style Shake to SOS
              </span>
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '600',
                backgroundColor: isEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                color: isEnabled ? 'var(--emerald-400)' : 'var(--text-dim)'
              }}>
                {isEnabled ? "ACTIVE" : "PAUSED"}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Shake your phone twice rapidly to trigger SOS without opening the menu.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleManualTestShake}
            title="Simulate shake gesture on desktop/laptop"
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            Test Gesture
          </button>

          <button
            type="button"
            className="btn-action-small"
            onClick={async () => {
              if (!isEnabled) {
                await shakeDetector.requestPermission();
              }
              onToggleEnabled();
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: isEnabled ? 'var(--emerald-600)' : 'var(--bg-card-hover)',
              color: 'white',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isEnabled ? "Enabled" : "Enable"}
          </button>
        </div>
      </div>
    </>
  );
}
