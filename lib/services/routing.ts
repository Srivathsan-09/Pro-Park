export interface LatLngPoint {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] array for Leaflet Polyline
  distanceKm: number;
  durationMinutes: number;
  formattedDistance: string;
  formattedDuration: string;
}

/**
 * Modular Routing Service using OSRM (Open Source Routing Machine)
 * Readily swappable with GraphHopper, Valhalla, or custom OSRM backend.
 */
class RoutingService {
  private baseUrl = "https://router.project-osrm.org/route/v1/driving";

  /**
   * Calculate driving route connecting start point, intermediate waypoints, and destination
   */
  async calculateRoute(waypoints: LatLngPoint[]): Promise<RouteResult | null> {
    if (!waypoints || waypoints.length < 2) return null;

    // Filter valid coordinates
    const validPoints = waypoints.filter(
      (p) =>
        typeof p.latitude === "number" &&
        !isNaN(p.latitude) &&
        typeof p.longitude === "number" &&
        !isNaN(p.longitude)
    );

    if (validPoints.length < 2) return null;

    try {
      // OSRM coordinates format: {lon},{lat};{lon},{lat}...
      const coordString = validPoints
        .map((p) => `${p.longitude},${p.latitude}`)
        .join(";");

      const url = `${this.baseUrl}/${coordString}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`OSRM HTTP status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        return this.createFallbackRoute(validPoints);
      }

      const primaryRoute = data.routes[0];
      const distanceMeters = primaryRoute.distance || 0;
      const durationSeconds = primaryRoute.duration || 0;

      // Convert geojson [lon, lat] coordinates to Leaflet [lat, lng]
      const coordinates: [number, number][] = (
        primaryRoute.geometry?.coordinates || []
      ).map((coord: [number, number]) => [coord[1], coord[0]]);

      const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
      const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

      return {
        coordinates: coordinates.length > 0 ? coordinates : this.createStraightLines(validPoints),
        distanceKm,
        durationMinutes,
        formattedDistance: `${distanceKm} km`,
        formattedDuration: this.formatDuration(durationMinutes),
      };
    } catch (error) {
      console.warn("OSRM routing service failed, falling back to direct line:", error);
      return this.createFallbackRoute(validPoints);
    }
  }

  private createFallbackRoute(points: LatLngPoint[]): RouteResult {
    const straightCoords = this.createStraightLines(points);
    let totalKm = 0;

    for (let i = 0; i < points.length - 1; i++) {
      totalKm += this.calculateHaversineDistance(
        points[i].latitude,
        points[i].longitude,
        points[i + 1].latitude,
        points[i + 1].longitude
      );
    }

    const roundedKm = Math.round(totalKm * 10) / 10;
    const estMinutes = Math.round((roundedKm / 35) * 60); // Approx 35 km/h city commute

    return {
      coordinates: straightCoords,
      distanceKm: roundedKm,
      durationMinutes: Math.max(5, estMinutes),
      formattedDistance: `${roundedKm} km`,
      formattedDuration: this.formatDuration(Math.max(5, estMinutes)),
    };
  }

  private createStraightLines(points: LatLngPoint[]): [number, number][] {
    return points.map((p) => [p.latitude, p.longitude]);
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min${minutes === 1 ? "" : "s"}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) {
      return `${hours} hr${hours === 1 ? "" : "s"}`;
    }
    return `${hours} hr ${remainingMins} min${remainingMins === 1 ? "" : "s"}`;
  }
}

export const routingService = new RoutingService();
