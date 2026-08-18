"use client";

import { useState, useCallback } from "react";
import { locationService, GeoPosition, GeoError } from "@/lib/services/location";
import { geocodingService, LocationResult } from "@/lib/services/geocoding";

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [locationResult, setLocationResult] = useState<LocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<LocationResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const pos = await locationService.getCurrentPosition();
      setPosition(pos);

      // Reverse geocode to human-readable address
      const rev = await geocodingService.reverse(pos.latitude, pos.longitude);
      if (rev) {
        setLocationResult(rev);
        setIsLoading(false);
        return rev;
      }

      const fallback: LocationResult = {
        displayName: `Lat: ${pos.latitude.toFixed(4)}, Lng: ${pos.longitude.toFixed(4)}`,
        shortName: "Current Location",
        latitude: pos.latitude,
        longitude: pos.longitude,
      };
      setLocationResult(fallback);
      setIsLoading(false);
      return fallback;
    } catch (err: any) {
      const msg = err.message || "Failed to retrieve current location.";
      setError(msg);
      setIsLoading(false);
      return null;
    }
  }, []);

  return {
    position,
    locationResult,
    isLoading,
    error,
    getCurrentLocation,
    clearError: () => setError(null),
  };
}
