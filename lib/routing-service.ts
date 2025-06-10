import axios from 'axios';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  coordinates: [number, number][]; // [lng, lat] format for GeoJSON
  distance: number; // in meters
  duration: number; // in seconds
}

export interface RoutingResponse {
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  coordinates: [number, number][]; // Full route coordinates
}

class RoutingService {
  private apiKey: string;
  private baseUrl = 'https://api.openrouteservice.org/v2/directions';
  private cache = new Map<string, RoutingResponse>();

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRouteService API key not found. Road snapping will be disabled.');
    }
  }

  private getCacheKey(points: RoutePoint[], profile: string): string {
    return `${profile}-${points.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('-')}`;
  }

  async getRoute(
    waypoints: RoutePoint[],
    profile: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car'
  ): Promise<RoutingResponse | null> {
    if (!this.apiKey || waypoints.length < 2) {
      return null;
    }

    const cacheKey = this.getCacheKey(waypoints, profile);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Convert waypoints to the format expected by OpenRouteService
      const coordinates = waypoints.map(point => [point.lng, point.lat]);
      
      const response = await axios.post(
        `${this.baseUrl}/${profile}/geojson`,
        {
          coordinates,
          format: 'geojson',
          instructions: false,
          geometry_simplify: false,
        },
        {
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const feature = response.data.features[0];
      const geometry = feature.geometry;
      const properties = feature.properties;

      const result: RoutingResponse = {
        segments: properties.segments || [],
        totalDistance: properties.summary?.distance || 0,
        totalDuration: properties.summary?.duration || 0,
        coordinates: geometry.coordinates,
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      
      // Limit cache size to prevent memory issues
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      return result;
    } catch (error) {
      console.error('Routing API error:', error);
      
      // If API fails, return null to fall back to straight lines
      return null;
    }
  }

  // Get route between two points (for incremental routing)
  async getRouteSegment(
    start: RoutePoint,
    end: RoutePoint,
    profile: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car'
  ): Promise<RouteSegment | null> {
    const route = await this.getRoute([start, end], profile);
    if (!route || route.segments.length === 0) {
      return null;
    }

    return {
      coordinates: route.coordinates,
      distance: route.totalDistance,
      duration: route.totalDuration,
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Check if API is available
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const routingService = new RoutingService();
