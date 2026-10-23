import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  Download, 
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function Header({ 
  isOnline, 
  isSimulatedOffline, 
  onToggleSimulatedOffline,
  pendingCount,
  activeTab,
  onSelectTab
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("ResQLink is already installed or your browser doesn't support automatic installation. You can install it via your browser menu (Add to Home Screen).");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const effectiveOnline = isOnline && !isSimulatedOffline;

  return (
    <header className="header-container">
      <div className="header-disclaimer-bar">
        <AlertTriangle size={14} className="inline-icon" />
        <span>AITHON 2.0 PROJECT — Offline-First Disaster Emergency Assistant. Backend acknowledgment is not civic dispatch.</span>
      </div>

      <div className="header-main">
        <div className="header-brand">
          <div className="brand-icon-wrapper" onClick={() => onSelectTab && onSelectTab('dashboard')} style={{ cursor: 'pointer' }}>
            <ShieldAlert size={28} className="brand-logo" />
            <span className="beacon-ping"></span>
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title" onClick={() => onSelectTab && onSelectTab('dashboard')} style={{ cursor: 'pointer' }}>ResQLink</h1>
              <span className="brand-badge">Offline AI PWA</span>
            </div>
            <p className="brand-subtitle">Emergency help that works with zero internet (AITHON 2.0)</p>
          </div>
        </div>

        <div className="header-controls">
          {onSelectTab && (
            <button
              type="button"
              className={`responder-toggle-pill ${activeTab === 'responder' ? 'pill-active-responder' : ''}`}
              onClick={() => onSelectTab(activeTab === 'responder' ? 'dashboard' : 'responder')}
              title="Toggle Responder Operations Dashboard"
            >
              <ShieldCheck size={16} />
              <span>{activeTab === 'responder' ? 'Exit Responder View' : 'Responder Portal'}</span>
            </button>
          )}

          <button 
            type="button"
            className={`sim-toggle-btn ${isSimulatedOffline ? 'sim-active' : ''}`}
            onClick={onToggleSimulatedOffline}
            title={isSimulatedOffline ? "Disable Simulated Offline" : "Simulate Offline Mode (Airplane Mode)"}
          >
            {isSimulatedOffline ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span>{isSimulatedOffline ? "Offline Sim: ON" : "Simulate Offline"}</span>
          </button>

          <div className={`status-pill ${effectiveOnline ? 'status-online' : 'status-offline'}`}>
            {effectiveOnline ? (
              <>
                <Wifi size={16} />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff size={16} />
                <span>{isSimulatedOffline ? 'Simulated Offline' : 'Offline'}</span>
              </>
            )}
            {pendingCount > 0 && (
              <span className="pending-bubble" title={`${pendingCount} SOS report(s) in queue`}>
                {pendingCount}
              </span>
            )}
          </div>

          {!isInstalled && (
            <button 
              type="button" 
              className="install-pwa-btn"
              onClick={handleInstallClick}
              title="Install ResQLink PWA"
            >
              <Download size={16} />
              <span className="hide-on-mobile">Install PWA</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
