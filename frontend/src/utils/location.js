export async function getGPSLocation(options = {}) {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
    ...options
  };

  if (!navigator.geolocation) {
    return {
      success: false,
      error: "Geolocation API is not supported by this browser.",
      code: "NOT_SUPPORTED",
      coordinates: null
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : null,
            altitude: position.coords.altitude ? Math.round(position.coords.altitude) : null,
            heading: position.coords.heading || null,
            speed: position.coords.speed || null
          },
          timestamp: new Date(position.timestamp).toISOString(),
          error: null
        });
      },
      (error) => {
        let errorMsg = "Unable to determine GPS location.";
        let code = "UNKNOWN";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location permission denied by user. Emergency reports will proceed without exact coordinates.";
            code = "PERMISSION_DENIED";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "GPS satellite / cell tower signal unavailable. Move towards open sky.";
            code = "POSITION_UNAVAILABLE";
            break;
          case error.TIMEOUT:
            errorMsg = "GPS acquisition timed out. Proceeding with last known or unlocated state.";
            code = "TIMEOUT";
            break;
        }

        resolve({
          success: false,
          error: errorMsg,
          code,
          coordinates: null
        });
      },
      defaultOptions
    );
  });
}

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

export function formatCoordinates(lat, lng) {
  if (lat == null || lng == null) return "Coordinates Unavailable";
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

export async function copyCoordinatesToClipboard(lat, lng, extra = "") {
  const coordText = formatCoordinates(lat, lng);
  const textToCopy = `EMERGENCY LOCATION: ${coordText} (Lat: ${lat}, Lng: ${lng}) ${extra}`.trim();
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      return { success: true, text: textToCopy };
    } catch (e) {}
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return { success: true, text: textToCopy };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
