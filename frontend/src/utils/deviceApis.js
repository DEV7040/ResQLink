export function triggerVibration(pattern = "sos") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return false;
  }

  try {
    if (pattern === "sos") {
      navigator.vibrate([
        150, 100, 150, 100, 150, 300,
        400, 100, 400, 100, 400, 300,
        150, 100, 150, 100, 150
      ]);
    } else if (pattern === "pulse") {
      navigator.vibrate([200, 100, 200]);
    }
    return true;
  } catch (err) {
    return false;
  }
}

export async function getDeviceBattery() {
  if (typeof navigator === "undefined" || !("getBattery" in navigator)) {
    return { supported: false, level: null, charging: null };
  }

  try {
    const battery = await navigator.getBattery();
    return {
      supported: true,
      level: Math.round(battery.level * 100),
      charging: battery.charging
    };
  } catch (err) {
    return { supported: false, level: null, charging: null };
  }
}
