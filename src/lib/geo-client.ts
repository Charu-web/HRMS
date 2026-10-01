/**
 * ZenithHR Enterprise Geolocation Client Helper
 * Robust browser position acquisition with automatic high-accuracy to standard-accuracy fallback
 */

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeoAcquireResult {
  coords: GeoPosition | null;
  error: string | null;
  status: "SUCCESS" | "DENIED" | "TIMEOUT" | "UNAVAILABLE" | "UNSUPPORTED";
}

/**
 * Acquire GPS coordinates with resilient fallback from High-Accuracy GPS to Standard Network/IP
 */
export async function acquireBrowserCoordinates(
  options: { timeout?: number; fallbackToStandard?: boolean } = {}
): Promise<GeoPosition> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    throw new Error("Geolocation is not supported by your current browser environment.");
  }

  const timeoutMs = options.timeout || 8000;

  // Primary attempt: high accuracy (GPS / Wi-Fi triangulation)
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 30000, // Accept 30-sec cached position to prevent cold-start delay
      });
    });

    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy),
      timestamp: pos.timestamp,
    };
  } catch (err: any) {
    // If permission was explicitly denied, do not attempt fallback
    if (err.code === 1) { // PERMISSION_DENIED
      throw new Error("Location permission was denied. Please allow location access in browser settings.");
    }

    // If fallback is enabled and error was timeout or unavailable, retry with standard accuracy
    if (options.fallbackToStandard !== false) {
      try {
        const fallbackPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: timeoutMs,
            maximumAge: 60000,
          });
        });

        return {
          latitude: fallbackPos.coords.latitude,
          longitude: fallbackPos.coords.longitude,
          accuracy: Math.round(fallbackPos.coords.accuracy),
          timestamp: fallbackPos.timestamp,
        };
      } catch (fallbackErr: any) {
        if (fallbackErr.code === 1) {
          throw new Error("Location permission was denied. Please allow location access in browser settings.");
        }
        if (fallbackErr.code === 3) {
          throw new Error("Location request timed out. Please check your network connection or move to an open area.");
        }
        throw new Error("GPS position unavailable. Please ensure location services are turned on.");
      }
    }

    if (err.code === 3) {
      throw new Error("GPS satellite acquisition timed out. Please retry or enable standard location.");
    }
    throw new Error("Location position unavailable. Please ensure device location is enabled.");
  }
}
