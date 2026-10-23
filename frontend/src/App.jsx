import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import NetworkStatus from './components/NetworkStatus';
import SOSButton from './components/SOSButton';
import EmergencyAssistant from './components/EmergencyAssistant';
import OfflineMap from './components/OfflineMap';
import SOSHistory from './components/SOSHistory';
import EmergencyContacts from './components/EmergencyContacts';
import AlertsFeed from './components/AlertsFeed';
import ResponderDashboard from './components/ResponderDashboard';
import MeshRelayModal from './components/MeshRelayModal';
import ShakeSOSListener from './components/ShakeSOSListener';

import { 
  processQueueSync, 
  getPendingQueueCount, 
  checkBackendHealth, 
  QUEUE_CHANGE_EVENT 
} from './utils/offlineQueue';

import { 
  LayoutDashboard, 
  BookOpen, 
  MapPin, 
  History, 
  PhoneCall, 
  AlertOctagon,
  Bell,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function App() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMeshModal, setShowMeshModal] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const triggerSOSRef = React.useRef(null);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingQueueCount());
  }, []);

  const checkHealth = useCallback(async () => {
    if (!isOnline || isSimulatedOffline) {
      setBackendHealth({ reachable: false, error: 'Offline Mode' });
      return;
    }
    const health = await checkBackendHealth();
    setBackendHealth(health);
  }, [isOnline, isSimulatedOffline]);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await processQueueSync({
        isSimulatedOffline
      });
      refreshPendingCount();
      await checkHealth();
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSimulatedOffline, isSyncing, refreshPendingCount, checkHealth]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!isSimulatedOffline) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = () => {
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(QUEUE_CHANGE_EVENT, handleQueueChange);

    refreshPendingCount();
    checkHealth();
    setLastSyncTime(new Date().toLocaleTimeString());

    const interval = setInterval(() => {
      checkHealth();
      if (getPendingQueueCount() > 0 && !isSimulatedOffline && navigator.onLine) {
        triggerSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(QUEUE_CHANGE_EVENT, handleQueueChange);
      clearInterval(interval);
    };
  }, [isSimulatedOffline, triggerSync, checkHealth, refreshPendingCount]);

  const handleToggleSimulatedOffline = () => {
    const nextState = !isSimulatedOffline;
    setIsSimulatedOffline(nextState);
    if (!nextState && isOnline) {
      setTimeout(() => {
        triggerSync();
      }, 300);
    }
  };

  return (
    <div className="app-layout">
      <Header
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={handleToggleSimulatedOffline}
        pendingCount={pendingCount}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <nav className="main-nav-bar">
        <div className="nav-container">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'assistant' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('assistant')}
          >
            <BookOpen size={18} />
            <span>AI Router & RAG</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'map' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <MapPin size={18} />
            <span>GPS & Shelters</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'alerts' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={18} />
            <span>Civic Alerts</span>
          </button>

          <button
            type="button"
            className="nav-tab-btn nav-mesh-tab"
            onClick={() => setShowMeshModal(true)}
            title="Mesh Relay: WebRTC hops between nearby phones"
          >
            <Radio size={18} className="text-amber animate-pulse" />
            <span>Mesh Relay (P2P)</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'history' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>SOS Registry</span>
            {pendingCount > 0 && (
              <span className="nav-pending-dot" title={`${pendingCount} pending reports`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'contacts' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <PhoneCall size={18} />
            <span>Contacts & SMS</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn nav-responder-tab ${activeTab === 'responder' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('responder')}
          >
            <ShieldCheck size={18} />
            <span>Responder Portal</span>
          </button>
        </div>
      </nav>

      <main className="main-viewport">
        <NetworkStatus
          isOnline={isOnline}
          isSimulatedOffline={isSimulatedOffline}
          backendHealth={backendHealth}
          pendingCount={pendingCount}
          onSyncNow={triggerSync}
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
        />

        {/* Motorola-style Shake to SOS Gesture Detector */}
        <ShakeSOSListener
          isEnabled={shakeEnabled}
          onToggleEnabled={() => setShakeEnabled((prev) => !prev)}
          onTriggerShakeSOS={() => {
            if (triggerSOSRef.current) {
              triggerSOSRef.current();
            }
          }}
        />

        {activeTab === 'dashboard' && (
          <div className="dashboard-view animate-fade-in">
            <SOSButton
              isOnline={isOnline}
              isSimulatedOffline={isSimulatedOffline}
              triggerDirectSOS={(triggerFn) => {
                triggerSOSRef.current = triggerFn;
              }}
              onSOSCreated={() => {
                refreshPendingCount();
                checkHealth();
              }}
            />

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header-bar">
                  <div className="card-title">
                    <MapPin size={18} className="text-red inline-icon" />
                    <h3>Live GPS & Nearest Shelters</h3>
                  </div>
                  <button
                    type="button"
                    className="card-action-link"
                    onClick={() => setActiveTab('map')}
                  >
                    Open Full Map &rarr;
                  </button>
                </div>
                <div className="card-content-body">
                  <OfflineMap
                    isOnline={isOnline}
                    isSimulatedOffline={isSimulatedOffline}
                  />
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header-bar">
                  <div className="card-title">
                    <BookOpen size={18} className="text-red inline-icon" />
                    <h3>AI Agent Router & NDMA/IFRC RAG</h3>
                  </div>
                  <button
                    type="button"
                    className="card-action-link"
                    onClick={() => setActiveTab('assistant')}
                  >
                    Voice / Multilingual &rarr;
                  </button>
                </div>
                <div className="card-content-body">
                  <EmergencyAssistant
                    onOpenMapFromRouter={() => setActiveTab('map')}
                    onTriggerSOSFromRouter={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="assistant-view animate-fade-in">
            <EmergencyAssistant
              onOpenMapFromRouter={() => setActiveTab('map')}
              onTriggerSOSFromRouter={() => {
                setActiveTab('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="map-view animate-fade-in">
            <OfflineMap
              isOnline={isOnline}
              isSimulatedOffline={isSimulatedOffline}
            />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-view animate-fade-in">
            <AlertsFeed
              isOnline={isOnline}
              isSimulatedOffline={isSimulatedOffline}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view animate-fade-in">
            <SOSHistory
              isOnline={isOnline}
              isSimulatedOffline={isSimulatedOffline}
            />
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="contacts-view animate-fade-in">
            <EmergencyContacts />
          </div>
        )}

        {activeTab === 'responder' && (
          <div className="responder-view animate-fade-in">
            <ResponderDashboard
              isOnline={isOnline}
              isSimulatedOffline={isSimulatedOffline}
            />
          </div>
        )}
      </main>

      <MeshRelayModal
        isOpen={showMeshModal}
        onClose={() => setShowMeshModal(false)}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onRelayComplete={() => {
          refreshPendingCount();
          checkHealth();
        }}
      />

      <footer className="mobile-bottom-nav">
        <button
          type="button"
          className={`mob-nav-btn ${activeTab === 'dashboard' ? 'mob-active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`mob-nav-btn ${activeTab === 'assistant' ? 'mob-active' : ''}`}
          onClick={() => setActiveTab('assistant')}
        >
          <BookOpen size={20} />
          <span>AI RAG</span>
        </button>

        <button
          type="button"
          className="mob-nav-sos-btn"
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="SOS"
        >
          <AlertOctagon size={24} />
          <span>SOS</span>
        </button>

        <button
          type="button"
          className="mob-nav-btn"
          onClick={() => setShowMeshModal(true)}
        >
          <Radio size={20} className="text-amber" />
          <span>Mesh</span>
        </button>

        <button
          type="button"
          className={`mob-nav-btn ${activeTab === 'responder' ? 'mob-active' : ''}`}
          onClick={() => setActiveTab('responder')}
        >
          <ShieldCheck size={20} />
          <span>EOC</span>
        </button>
      </footer>
    </div>
  );
}
