/**
 * Shake Detection Utility (DeviceMotion API)
 * Similar to Motorola shake/chop gesture for quick actions
 */

class ShakeDetector {
  constructor() {
    this.threshold = 18; // Acceleration threshold (m/s^2)
    this.timeout = 1000;  // Max time between shakes in ms
    this.requiredShakes = 2; // Double shake like Moto gesture
    this.lastX = null;
    this.lastY = null;
    this.lastZ = null;
    this.lastTime = 0;
    this.shakeCount = 0;
    this.lastShakeTime = 0;
    this.callback = null;
    this.isListening = false;
    this.handleMotion = this.handleMotion.bind(this);
  }

  isSupported() {
    return typeof window !== "undefined" && "DeviceMotionEvent" in window;
  }

  async requestPermission() {
    // iOS 13+ requires explicit permission request
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        return response === "granted";
      } catch (e) {
        console.warn("DeviceMotionEvent permission request error:", e);
        return false;
      }
    }
    return true; // Android & standard desktop/mobile browsers allow by default
  }

  start(onShakeCallback) {
    if (!this.isSupported() || this.isListening) return false;
    this.callback = onShakeCallback;
    this.shakeCount = 0;
    this.lastTime = Date.now();
    window.addEventListener("devicemotion", this.handleMotion, false);
    this.isListening = true;
    return true;
  }

  stop() {
    if (!this.isListening) return;
    window.removeEventListener("devicemotion", this.handleMotion, false);
    this.isListening = false;
    this.shakeCount = 0;
    this.lastX = null;
    this.lastY = null;
    this.lastZ = null;
  }

  handleMotion(event) {
    const current = event.accelerationIncludingGravity || event.acceleration;
    if (!current) return;

    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastTime;

    // Throttle checks every 100ms
    if (timeDiff > 100) {
      const x = current.x || 0;
      const y = current.y || 0;
      const z = current.z || 0;

      if (this.lastX !== null) {
        const deltaX = Math.abs(x - this.lastX);
        const deltaY = Math.abs(y - this.lastY);
        const deltaZ = Math.abs(z - this.lastZ);

        // Calculate maximum acceleration delta
        const delta = deltaX + deltaY + deltaZ;

        if (delta > this.threshold) {
          // If the last shake was too long ago, reset counter
          if (currentTime - this.lastShakeTime > this.timeout) {
            this.shakeCount = 0;
          }

          this.shakeCount++;
          this.lastShakeTime = currentTime;

          // Double shake detected (like Moto flashlight gesture)
          if (this.shakeCount >= this.requiredShakes) {
            this.shakeCount = 0;
            if (this.callback) {
              this.callback();
            }
          }
        }
      }

      this.lastX = x;
      this.lastY = y;
      this.lastZ = z;
      this.lastTime = currentTime;
    }
  }
}

export const shakeDetector = new ShakeDetector();
