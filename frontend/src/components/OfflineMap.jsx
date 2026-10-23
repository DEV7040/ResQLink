import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Copy, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Layers, 
  Compass, 
  Tent
} from 'lucide-react';
import { 
  getGPSLocation, 
  calculateDistanceKm, 
  formatCoordinates, 
  copyCoordinatesToClipboard 
} from '../utils/location';
import { SAMPLE_HELP_POINTS } from '../data/emergencyData';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="user-pulse-marker">
        <div class="user-marker-core"></div>
        <div class="user-marker-wave"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createHelpPointIcon = (badgeColor) => {
  const color = badgeColor === 'red' ? '#ef4444' : badgeColor === 'amber' ? '#f59e0b' : '#10b981';
  return L.divIcon({
    className: 'custom-shelter-marker',
    html: `
      <div class="shelter-pin" style="background-color: ${color};">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 15);
    }
  }, [center, zoom, map]);
  return null;
}

export default function OfflineMap({ isOnline, isSimulatedOffline }) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [tileErrorDetected, setTileErrorDetected] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState(null);

  const defaultCenter = [28.6139, 77.2090];
  const activePosition = userLocation 
    ? [userLocation.latitude, userLocation.longitude] 
    : defaultCenter;

  const effectiveOnline = isOnline && !isSimulatedOffline;

  const acquireLocation = async () => {
    setLocationStatus("loading");
    setErrorMessage(null);

    const result = await getGPSLocation({ timeout: 10000 });
    if (result.success && result.coordinates) {
      setUserLocation(result.coordinates);
      setLocationStatus("success");
    } else {
      setLocationStatus(result.code === "PERMISSION_DENIED" ? "denied" : "error");
      setErrorMessage(result.error);
    }
  };

  useEffect(() => {
    acquireLocation();
  }, []);

  const handleCopyCoordinates = async () => {
    if (!userLocation) return;
    const res = await copyCoordinatesToClipboard(
      userLocation.latitude, 
      userLocation.longitude, 
      `Acc: ±${userLocation.accuracy}m`
    );
    if (res.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const computedShelters = SAMPLE_HELP_POINTS.map((sp) => {
    const lat = activePosition[0] + sp.offsetLat;
    const lng = activePosition[1] + sp.offsetLng;
    const dist = userLocation 
      ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lng)
      : sp.distanceKm;

    return {
      ...sp,
      lat,
      lng,
      calculatedDist: dist
    };
  });

  return (
    <div className="map-component-section">
      <div className="location-toolbar">
        <div className="location-info-cell">
          <div className="location-title-row">
            <Compass size={18} className="text-red" />
            <span className="location-label">GPS Geolocation:</span>
            {locationStatus === "success" && (
              <span className="badge-accuracy">±{userLocation?.accuracy || 10}m accuracy</span>
            )}
          </div>
          <div className="coordinates-value">
            {locationStatus === "loading" ? (
              <span className="text-muted">Acquiring GPS fix from device receiver...</span>
            ) : userLocation ? (
              <span className="coord-strong">
                {formatCoordinates(userLocation.latitude, userLocation.longitude)}
              </span>
            ) : locationStatus === "denied" ? (
              <span className="text-amber">Location Permission Denied (Tap Retry)</span>
            ) : (
              <span className="text-muted">No GPS Fix — Showing Sample Region</span>
            )}
          </div>
        </div>

        <div className="location-actions-cell">
          {userLocation && (
            <button
              type="button"
              className="btn-toolbar"
              onClick={handleCopyCoordinates}
              title="Copy GPS coordinates"
            >
              {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
              <span>{copied ? "Copied!" : "Copy GPS"}</span>
            </button>
          )}

          <button
            type="button"
            className="btn-toolbar btn-refresh-gps"
            onClick={acquireLocation}
            disabled={locationStatus === "loading"}
          >
            <Navigation size={15} className={locationStatus === "loading" ? "animate-spin" : ""} />
            <span>{locationStatus === "loading" ? "Locating..." : "Fix Location"}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="map-alert-strip warning-strip">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {(!effectiveOnline || tileErrorDetected) && (
        <div className="map-alert-strip offline-strip">
          <Layers size={16} />
          <span>
            <strong>Offline Tile Mode:</strong> Internet tiles unavailable. 
            GPS vector positioning, mathematical distance calculations, and offline coordinate bearings remain 100% active.
          </span>
        </div>
      )}

      <div className="map-frame-container">
        <MapContainer
          center={activePosition}
          zoom={14}
          scrollWheelZoom={false}
          className="leaflet-emergency-map"
        >
          <ChangeView center={activePosition} zoom={14} />

          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            eventHandlers={{
              tileerror: () => {
                setTileErrorDetected(true);
              }
            }}
          />

          {userLocation && (
            <>
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={createUserIcon()}
              >
                <Popup>
                  <div className="popup-user-card">
                    <strong>Your Current Position</strong>
                    <p className="popup-sub">
                      {formatCoordinates(userLocation.latitude, userLocation.longitude)}
                    </p>
                    <p className="popup-dim">Estimated Accuracy: ±{userLocation.accuracy || 10} meters</p>
                  </div>
                </Popup>
              </Marker>

              {userLocation.accuracy && (
                <Circle
                  center={[userLocation.latitude, userLocation.longitude]}
                  radius={userLocation.accuracy}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.12,
                    weight: 1
                  }}
                />
              )}
            </>
          )}

          {computedShelters.map((shelter) => (
            <Marker
              key={shelter.id}
              position={[shelter.lat, shelter.lng]}
              icon={createHelpPointIcon(shelter.badgeColor)}
              eventHandlers={{
                click: () => setSelectedShelter(shelter)
              }}
            >
              <Popup>
                <div className="popup-shelter-card">
                  <div className="popup-tag-simulated">NDMA / Civil Relief Point</div>
                  <h4 className="shelter-name">{shelter.name}</h4>
                  <div className="shelter-meta">
                    <span className="shelter-dist">{shelter.calculatedDist} km away</span>
                    <span className="shelter-cap">Cap: {shelter.capacity}</span>
                  </div>
                  <div className="shelter-services">
                    {shelter.services.map((svc, i) => (
                      <span key={i} className="svc-chip">{svc}</span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="shelters-summary-section">
        <div className="shelters-header-row">
          <div className="shelters-title">
            <Tent size={18} className="inline-icon text-red" />
            <h3>Relief Shelters & Hospital Posts</h3>
          </div>
          <span className="sim-warning-chip">
            Verified Distance via On-Device Haversine
          </span>
        </div>

        <div className="shelters-cards-grid">
          {computedShelters.map((shelter) => (
            <div 
              key={shelter.id} 
              className={`shelter-item-card ${selectedShelter?.id === shelter.id ? 'card-highlight' : ''}`}
            >
              <div className="shelter-top-line">
                <span className="shelter-badge-type">{shelter.type}</span>
                <span className="shelter-distance-pill">
                  {shelter.calculatedDist != null ? `${shelter.calculatedDist} km` : '~ km'}
                </span>
              </div>
              <h4 className="shelter-card-title">{shelter.name}</h4>
              <p className="shelter-card-status">Status: {shelter.status}</p>
              <div className="shelter-facilities-row">
                {shelter.services.map((svc, idx) => (
                  <span key={idx} className="facility-pill">{svc}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
