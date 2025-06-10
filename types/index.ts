export interface GPXPoint {
  lat: number;
  lng: number;
  elevation?: number;
  time?: Date;
}

export interface GPXRoute {
  id: string;
  name: string;
  description?: string;
  points: GPXPoint[];
  distance: number; // in meters
  duration?: number; // in seconds
  activityType: 'running' | 'cycling' | 'walking';
  createdAt: Date;
  updatedAt: Date;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
}

export interface RouteCreationState {
  isCreating: boolean;
  currentRoute: GPXPoint[];
  activityType: 'running' | 'cycling' | 'walking';
}

// GPX Form Types
export interface GPXFormData {
  name: string;
  description?: string;
  activityType: 'Run' | 'Bike';
  inputType: 'speed' | 'pace';
  averageSpeedKmh: number;
  averagePaceMinPerKm: number;
  coordinates: [number, number][];
  distance: number; // in km
}

export interface GPXFormPreview {
  estimatedDurationSeconds: number;
  estimatedDurationFormatted: string;
  averageSpeed: number;
  averagePace: number;
  distance: number;
}

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  order: number;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [lng, lat] format
  isRouted: boolean; // true if routed via API, false if straight lines
}
