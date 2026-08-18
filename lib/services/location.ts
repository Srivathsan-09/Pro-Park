export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
}

export type GeolocationErrorType =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "NOT_SUPPORTED";

export interface GeoError {
  type: GeolocationErrorType;
  message: string;
}

/**
 * Geolocation & Live Driver Tracking Service
 */
class LocationService {
  /**
   * Check if browser supports Geolocation API
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "geolocation" in navigator;
  }

  /**
   * Request single current position snapshot
   */
  async getCurrentPosition(options?: PositionOptions): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject({
          type: "NOT_SUPPORTED",
          message: "Geolocation is not supported by your browser.",
        } as GeoError);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          });
        },
        (err) => {
          let errorType: GeolocationErrorType = "POSITION_UNAVAILABLE";
          let userMessage = "Could not retrieve your current location.";

          if (err.code === err.PERMISSION_DENIED) {
            errorType = "PERMISSION_DENIED";
            userMessage =
              "Location access was denied. Please allow location permissions in your browser settings.";
          } else if (err.code === err.TIMEOUT) {
            errorType = "TIMEOUT";
            userMessage = "Location request timed out. Please try again.";
          }

          reject({
            type: errorType,
            message: userMessage,
          } as GeoError);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
          ...options,
        }
      );
    });
  }

  /**
   * Start continuous live tracking for an active driver
   * Only called when a driver explicitly starts a live ride
   */
  watchPosition(
    onSuccess: (pos: GeoPosition) => void,
    onError?: (err: GeoError) => void,
    options?: PositionOptions
  ): () => void {
    if (!this.isSupported()) {
      if (onError) {
        onError({
          type: "NOT_SUPPORTED",
          message: "Geolocation is not supported by your browser.",
        });
      }
      return () => {};
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onSuccess({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        });
      },
      (err) => {
        if (onError) {
          let errorType: GeolocationErrorType = "POSITION_UNAVAILABLE";
          let message = "Unable to track live location.";

          if (err.code === err.PERMISSION_DENIED) {
            errorType = "PERMISSION_DENIED";
            message = "Location permission denied.";
          } else if (err.code === err.TIMEOUT) {
            errorType = "TIMEOUT";
            message = "Location update timed out.";
          }

          onError({ type: errorType, message });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
        ...options,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }
}

export const locationService = new LocationService();
