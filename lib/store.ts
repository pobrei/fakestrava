import { create } from 'zustand';
import { distance } from '@turf/distance';
import { point } from '@turf/helpers';
import { routingService, RoutePoint } from './routing-service';

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  order: number;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [lng, lat] format
  isRouted: boolean; // true if from API, false if straight line
}

interface WaypointStore {
  waypoints: Waypoint[];
  routeGeometry: RouteGeometry | null;
  totalDistance: number;
  isRouting: boolean;
  routingProfile: 'driving-car' | 'cycling-regular' | 'foot-walking';
  addWaypoint: (lat: number, lng: number) => Promise<void>;
  updateWaypoint: (id: string, lat: number, lng: number) => Promise<void>;
  deleteWaypoint: (id: string) => Promise<void>;
  clearWaypoints: () => void;
  setRoutingProfile: (profile: 'driving-car' | 'cycling-regular' | 'foot-walking') => void;
  calculateRoute: () => Promise<void>;
  calculateTotalDistance: () => void;
}

export const useWaypointStore = create<WaypointStore>((set, get) => ({
  waypoints: [],
  routeGeometry: null,
  totalDistance: 0,
  isRouting: false,
  routingProfile: 'driving-car',

  addWaypoint: async (lat: number, lng: number) => {
    const waypoints = get().waypoints;
    const newWaypoint: Waypoint = {
      id: crypto.randomUUID(),
      lat,
      lng,
      order: waypoints.length,
    };

    const newWaypoints = [...waypoints, newWaypoint];
    set({ waypoints: newWaypoints });

    // Calculate route if we have 2+ waypoints
    if (newWaypoints.length >= 2) {
      await get().calculateRoute();
    } else {
      get().calculateTotalDistance();
    }
  },

  updateWaypoint: async (id: string, lat: number, lng: number) => {
    const waypoints = get().waypoints;
    const updatedWaypoints = waypoints.map(wp =>
      wp.id === id ? { ...wp, lat, lng } : wp
    );
    set({ waypoints: updatedWaypoints });

    // Recalculate route if we have 2+ waypoints
    if (updatedWaypoints.length >= 2) {
      await get().calculateRoute();
    } else {
      get().calculateTotalDistance();
    }
  },

  deleteWaypoint: async (id: string) => {
    const waypoints = get().waypoints;
    const filteredWaypoints = waypoints
      .filter(wp => wp.id !== id)
      .map((wp, index) => ({ ...wp, order: index }));

    set({ waypoints: filteredWaypoints });

    // Recalculate route if we have 2+ waypoints
    if (filteredWaypoints.length >= 2) {
      await get().calculateRoute();
    } else {
      set({ routeGeometry: null });
      get().calculateTotalDistance();
    }
  },

  clearWaypoints: () => {
    set({ waypoints: [], routeGeometry: null, totalDistance: 0 });
  },

  setRoutingProfile: (profile: 'driving-car' | 'cycling-regular' | 'foot-walking') => {
    set({ routingProfile: profile });
    // Recalculate route with new profile
    const waypoints = get().waypoints;
    if (waypoints.length >= 2) {
      get().calculateRoute();
    }
  },

  calculateRoute: async () => {
    const { waypoints, routingProfile } = get();

    if (waypoints.length < 2) {
      set({ routeGeometry: null, totalDistance: 0 });
      return;
    }

    set({ isRouting: true });

    try {
      const routePoints: RoutePoint[] = waypoints
        .sort((a, b) => a.order - b.order)
        .map(wp => ({ lat: wp.lat, lng: wp.lng }));

      const routeResponse = await routingService.getRoute(routePoints, routingProfile);

      if (routeResponse) {
        // Use routed geometry
        const routeGeometry: RouteGeometry = {
          coordinates: routeResponse.coordinates,
          isRouted: true,
        };

        set({
          routeGeometry,
          totalDistance: routeResponse.totalDistance / 1000, // Convert to km
          isRouting: false
        });
      } else {
        // Fall back to straight lines
        const straightLineCoords = routePoints.map(p => [p.lng, p.lat] as [number, number]);
        const routeGeometry: RouteGeometry = {
          coordinates: straightLineCoords,
          isRouted: false,
        };

        set({ routeGeometry, isRouting: false });
        get().calculateTotalDistance();
      }
    } catch (error) {
      console.error('Route calculation failed:', error);

      // Fall back to straight lines
      const routePoints: RoutePoint[] = waypoints
        .sort((a, b) => a.order - b.order)
        .map(wp => ({ lat: wp.lat, lng: wp.lng }));

      const straightLineCoords = routePoints.map(p => [p.lng, p.lat] as [number, number]);
      const routeGeometry: RouteGeometry = {
        coordinates: straightLineCoords,
        isRouted: false,
      };

      set({ routeGeometry, isRouting: false });
      get().calculateTotalDistance();
    }
  },

  calculateTotalDistance: () => {
    const waypoints = get().waypoints;
    if (waypoints.length < 2) {
      set({ totalDistance: 0 });
      return;
    }

    // Sort waypoints by order to ensure correct distance calculation
    const sortedWaypoints = [...waypoints].sort((a, b) => a.order - b.order);

    let total = 0;
    for (let i = 0; i < sortedWaypoints.length - 1; i++) {
      const from = point([sortedWaypoints[i].lng, sortedWaypoints[i].lat]);
      const to = point([sortedWaypoints[i + 1].lng, sortedWaypoints[i + 1].lat]);
      total += distance(from, to, { units: 'kilometers' });
    }

    set({ totalDistance: total });
  },
}));
