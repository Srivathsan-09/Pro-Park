export interface LocationResult {
  displayName: string;
  shortName: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

/**
 * Modular Geocoding Service using OpenStreetMap Nominatim
 * Easily swappable for Mapbox, Photon, or custom Pelias instances.
 */
class GeocodingService {
  private baseUrl = "https://nominatim.openstreetmap.org";

  /**
   * Search for locations matching a query string
   */
  async search(query: string, limit: number = 6): Promise<LocationResult[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const url = `${this.baseUrl}/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&addressdetails=1&limit=${limit}&countrycodes=in`; // Optimized for India / campus region

      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });

      if (!res.ok) {
        throw new Error(`Nominatim HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => {
        const address = item.address || {};
        const shortName =
          item.name ||
          address.suburb ||
          address.neighbourhood ||
          address.road ||
          item.display_name.split(",")[0];

        return {
          displayName: item.display_name,
          shortName: shortName.trim(),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          city: address.city || address.town || address.state_district,
          state: address.state,
        };
      });
    } catch (error) {
      console.warn("Geocoding search failed:", error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to a human-readable address
   */
  async reverse(latitude: number, longitude: number): Promise<LocationResult | null> {
    try {
      const url = `${this.baseUrl}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });

      if (!res.ok) {
        throw new Error(`Nominatim reverse HTTP ${res.status}`);
      }

      const item = await res.json();
      if (!item || !item.display_name) return null;

      const address = item.address || {};
      const shortName =
        item.name ||
        address.suburb ||
        address.neighbourhood ||
        address.road ||
        item.display_name.split(",")[0];

      return {
        displayName: item.display_name,
        shortName: shortName.trim(),
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city: address.city || address.town || address.state_district,
        state: address.state,
      };
    } catch (error) {
      console.warn("Reverse geocoding failed:", error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();
