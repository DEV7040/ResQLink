import React, { useState } from 'react';
import { 
  PhoneCall, 
  MessageSquare, 
  Activity, 
  Flame, 
  ShieldAlert, 
  LifeBuoy, 
  Radio, 
  Home, 
  HeartHandshake, 
  Send, 
  Copy, 
  Check, 
  PhoneForwarded,
  Info
} from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../data/emergencyData';
import { getGPSLocation, formatCoordinates } from '../utils/location';

const CONTACT_ICON_MAP = {
  PhoneCall,
  Activity,
  Flame,
  ShieldAlert,
  LifeBuoy,
  Radio,
  Home,
  HeartHandshake
};

export default function EmergencyContacts() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [smsCopied, setSmsCopied] = useState(false);
  const [smsTargetNumber, setSmsTargetNumber] = useState("112");
  const [smsCustomMessage, setSmsCustomMessage] = useState("EMERGENCY SOS: Immediate rescue needed. We are stranded.");
  const [smsCoordinates, setSmsCoordinates] = useState(null);
  const [isAcquiringLocation, setIsAcquiringLocation] = useState(false);

  const categories = [
    { id: "all", label: "All Numbers" },
    { id: "Unified", label: "112 Primary" },
    { id: "Medical", label: "Medical (108)" },
    { id: "Fire", label: "Fire (101)" },
    { id: "Police", label: "Police (100)" },
    { id: "Disaster", label: "Disaster / NDRF" }
  ];

  const filteredContacts = EMERGENCY_CONTACTS.filter(
    (c) => selectedCategory === "all" || c.category === selectedCategory
  );

  const generateSMSBody = () => {
    let text = `${smsCustomMessage.trim()}`;
    if (smsCoordinates) {
      text += ` | LOC: ${formatCoordinates(smsCoordinates.latitude, smsCoordinates.longitude)} (Lat:${smsCoordinates.latitude.toFixed(5)}, Lng:${smsCoordinates.longitude.toFixed(5)})`;
    } else {
      text += ` | [No GPS attached - Locate via cell tower]`;
    }
    return text;
  };

  const handleAcquireSMSCoords = async () => {
    setIsAcquiringLocation(true);
    const loc = await getGPSLocation({ timeout: 6000 });
    if (loc.success && loc.coordinates) {
      setSmsCoordinates(loc.coordinates);
    }
    setIsAcquiringLocation(false);
  };

  const handleCopySMS = async () => {
    const text = generateSMSBody();
    try {
      await navigator.clipboard.writeText(text);
      setSmsCopied(true);
      setTimeout(() => setSmsCopied(false), 2500);
    } catch (e) {}
  };

  const smsLink = `sms:${smsTargetNumber}?body=${encodeURIComponent(generateSMSBody())}`;

  return (
    <div className="contacts-section">
      <div className="sms-relay-card">
        <div className="sms-header">
          <div className="sms-title-row">
            <MessageSquare size={22} className="text-red" />
            <div>
              <h3>Offline Cellular SMS Dispatcher</h3>
              <p className="sms-subtitle">
                Works over basic 2G cellular when data / internet is completely dead.
              </p>
            </div>
          </div>
          <span className="badge-offline-sms">No Internet Required</span>
        </div>

        <div className="sms-composer-grid">
          <div className="sms-field-group">
            <label className="sms-field-label">Recipient Hotline Number:</label>
            <input
              type="text"
              className="sms-number-input"
              value={smsTargetNumber}
              onChange={(e) => setSmsTargetNumber(e.target.value)}
              placeholder="e.g. 112 or trusted relative"
            />
          </div>

          <div className="sms-field-group">
            <div className="sms-label-action-row">
              <label className="sms-field-label">Message & Situation:</label>
              <button
                type="button"
                className="btn-attach-loc"
                onClick={handleAcquireSMSCoords}
                disabled={isAcquiringLocation}
              >
                {isAcquiringLocation ? "Acquiring GPS..." : smsCoordinates ? "GPS Attached ✓" : "Attach GPS Location"}
              </button>
            </div>
            <textarea
              className="sms-text-area"
              rows={2}
              value={smsCustomMessage}
              onChange={(e) => setSmsCustomMessage(e.target.value)}
            />
          </div>
        </div>

        <div className="sms-preview-box">
          <span className="sms-preview-label">Generated SMS Payload:</span>
          <p className="sms-preview-content">{generateSMSBody()}</p>
        </div>

        <div className="sms-actions-row">
          <a
            href={smsLink}
            className="btn-open-sms"
          >
            <Send size={16} />
            <span>Launch SMS Composer</span>
          </a>

          <button
            type="button"
            className="btn-copy-sms"
            onClick={handleCopySMS}
          >
            {smsCopied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            <span>{smsCopied ? "Copied!" : "Copy SMS Text"}</span>
          </button>
        </div>
      </div>

      <div className="contacts-directory">
        <div className="directory-header">
          <div className="directory-title">
            <PhoneCall size={20} className="inline-icon text-red" />
            <h3>Official Emergency Hotlines</h3>
          </div>
          <span className="region-note">Regional Preset: India (Universal 112)</span>
        </div>

        <div className="contact-filter-row">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cat-pill ${selectedCategory === cat.id ? 'cat-active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="contacts-grid">
          {filteredContacts.map((contact, index) => {
            const IconComp = CONTACT_ICON_MAP[contact.icon] || PhoneCall;

            return (
              <div key={index} className="contact-card">
                <div className="contact-card-top">
                  <div className="contact-icon-wrapper">
                    <IconComp size={22} />
                  </div>
                  <span className="contact-badge">{contact.badge}</span>
                </div>

                <h4 className="contact-name">{contact.name}</h4>
                <p className="contact-desc">{contact.description}</p>

                <div className="contact-call-action">
                  <a
                    href={`tel:${contact.number}`}
                    className="btn-call-emergency"
                  >
                    <PhoneForwarded size={16} />
                    <span>Call {contact.number}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
