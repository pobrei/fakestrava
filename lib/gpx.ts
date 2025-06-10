import { distance } from '@turf/distance';
import { point } from '@turf/helpers';

// Enhanced GPX Point interface
export interface GPXPoint {
  lat: number;
  lng: number;
  elevation?: number;
  time?: Date;
}

// Enhanced GPX generation options
export interface GPXGenerationOptions {
  name: string;
  description?: string;
  activityType: 'Run' | 'Bike' | 'Walk';
  coordinates: [number, number][]; // [lng, lat] format from routing
  startTime?: Date;
  // Speed/pace options (mutually exclusive)
  averageSpeedKmh?: number; // km/h
  averagePaceMinPerKm?: number; // minutes per km
  // Elevation options
  elevationGain?: number; // total elevation gain in meters
  elevationProfile?: 'flat' | 'hilly' | 'mountainous';
  // Advanced options
  addNoise?: boolean; // Add realistic speed variations
  pauseDuration?: number; // Add pauses in seconds
  // Realistic timing options
  useRealisticTiming?: boolean; // Use human-like pacing patterns
  samplingRateSeconds?: number; // GPS sampling rate for realistic timing
  speedVariation?: number; // Speed variation factor for realistic timing
  // Elevation API options
  addElevation?: boolean; // Add elevation data to GPX
  useRealElevation?: boolean; // Use real elevation API instead of simulated
}

// Default speeds for different activities (km/h)
const DEFAULT_SPEEDS = {
  Run: 10, // 6 min/km pace
  Bike: 25, // recreational cycling
  Walk: 5, // casual walking
};

// Elevation profiles (meters per km)
const ELEVATION_PROFILES = {
  flat: { min: 0, max: 10 },
  hilly: { min: 20, max: 50 },
  mountainous: { min: 50, max: 100 },
};

export async function generateGpx(options: GPXGenerationOptions): Promise<string> {
  const {
    name,
    description,
    activityType,
    coordinates,
    startTime = new Date(),
    averageSpeedKmh,
    averagePaceMinPerKm,
    elevationGain,
    elevationProfile = 'flat',
    addNoise = true,
    pauseDuration = 0,
    useRealisticTiming = false,
    samplingRateSeconds = 4,
    speedVariation = 0.15,
    addElevation = false,
    useRealElevation = false,
  } = options;

  // Calculate speed
  let speedKmh: number;
  if (averageSpeedKmh) {
    speedKmh = averageSpeedKmh;
  } else if (averagePaceMinPerKm) {
    speedKmh = 60 / averagePaceMinPerKm; // Convert pace to speed
  } else {
    speedKmh = DEFAULT_SPEEDS[activityType];
  }

  // Use realistic timing if requested
  if (useRealisticTiming) {
    const points = coordinates.map(([lng, lat]) => ({ lat, lng }));
    return await generateRealisticGPX(points, {
      avgSpeedKmh: speedKmh,
      startTime,
      name,
      description: description || `${activityType} activity`,
      activityType,
      samplingRateSeconds,
      speedVariation,
      addElevation: addElevation || elevationGain !== undefined,
      elevationGain,
      useRealElevation
    });
  }

  // Convert coordinates to GPX points with timestamps and elevation
  const gpxPoints = generateTrackPoints(
    coordinates,
    startTime,
    speedKmh,
    elevationGain,
    elevationProfile,
    addNoise,
    pauseDuration
  );

  // Generate GPX XML
  return generateGPXXML(name, description || `${activityType} activity`, activityType, gpxPoints, startTime);
}

function generateTrackPoints(
  coordinates: [number, number][],
  startTime: Date,
  speedKmh: number,
  elevationGain?: number,
  elevationProfile: 'flat' | 'hilly' | 'mountainous' = 'flat',
  addNoise: boolean = true,
  pauseDuration: number = 0
): GPXPoint[] {
  if (coordinates.length < 2) {
    return coordinates.map(([lng, lat]) => ({ lat, lng, time: startTime }));
  }

  const points: GPXPoint[] = [];
  let currentTime = new Date(startTime);
  let totalDistance = 0;
  const cumulativeElevation = 0;

  // Calculate total route distance for elevation distribution
  const totalRouteDistance = calculateCoordinatesDistance(coordinates);

  for (let i = 0; i < coordinates.length; i++) {
    const [lng, lat] = coordinates[i];

    // Calculate elevation for this point
    let elevation: number | undefined;
    if (elevationGain !== undefined || elevationProfile !== 'flat') {
      elevation = calculateElevation(
        i,
        coordinates.length,
        totalDistance,
        totalRouteDistance,
        elevationGain || 0,
        elevationProfile,
        cumulativeElevation
      );
    }

    // Add the point
    points.push({
      lat,
      lng,
      elevation,
      time: new Date(currentTime),
    });

    // Calculate time to next point (if not the last point)
    if (i < coordinates.length - 1) {
      const segmentDistance = calculateSegmentDistance(coordinates[i], coordinates[i + 1]);
      totalDistance += segmentDistance;

      // Calculate base time for this segment
      let segmentSpeedKmh = speedKmh;

      // Add realistic speed variations
      if (addNoise) {
        const variation = 0.8 + Math.random() * 0.4; // ±20% variation
        segmentSpeedKmh *= variation;

        // Adjust speed based on elevation change if elevation is available
        if (elevation !== undefined && points[i - 1]?.elevation !== undefined) {
          const elevationChange = elevation - points[i - 1].elevation!;
          const elevationFactor = calculateSpeedAdjustmentForElevation(elevationChange, segmentDistance);
          segmentSpeedKmh *= elevationFactor;
        }
      }

      // Calculate time for this segment
      const segmentTimeHours = segmentDistance / segmentSpeedKmh;
      const segmentTimeMs = segmentTimeHours * 3600 * 1000;

      // Add pause duration occasionally for realism
      let pauseMs = 0;
      if (pauseDuration > 0 && Math.random() < 0.1) { // 10% chance of pause
        pauseMs = pauseDuration * 1000 * (0.5 + Math.random() * 0.5); // 50-100% of pause duration
      }

      currentTime = new Date(currentTime.getTime() + segmentTimeMs + pauseMs);
    }
  }

  return points;
}

// Helper function to calculate distance between two coordinates
function calculateSegmentDistance(coord1: [number, number], coord2: [number, number]): number {
  const from = point([coord1[0], coord1[1]]);
  const to = point([coord2[0], coord2[1]]);
  return distance(from, to, { units: 'kilometers' });
}

// Helper function to calculate total route distance for coordinates
function calculateCoordinatesDistance(coordinates: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += calculateSegmentDistance(coordinates[i], coordinates[i + 1]);
  }
  return total;
}

// Helper function to calculate elevation for a point
function calculateElevation(
  pointIndex: number,
  totalPoints: number,
  currentDistance: number,
  totalDistance: number,
  totalElevationGain: number,
  elevationProfile: 'flat' | 'hilly' | 'mountainous',
  baseElevation: number = 100
): number {
  const progress = pointIndex / (totalPoints - 1);

  // Base elevation pattern (sine wave for realistic hills)
  const profileSettings = ELEVATION_PROFILES[elevationProfile];
  const elevationVariation = profileSettings.min +
    (profileSettings.max - profileSettings.min) * Math.sin(progress * Math.PI * 2);

  // Add cumulative elevation gain
  const cumulativeGain = totalElevationGain * progress;

  // Add some random noise for realism
  const noise = (Math.random() - 0.5) * 10; // ±5m random variation

  return Math.round(baseElevation + cumulativeGain + elevationVariation + noise);
}

// Helper function to adjust speed based on elevation change
function calculateSpeedAdjustmentForElevation(elevationChange: number, distance: number): number {
  if (distance === 0) return 1;

  const gradient = (elevationChange / 1000) / distance; // elevation change per km

  // Speed adjustment factors based on gradient
  if (gradient > 0.05) { // Steep uphill (>5%)
    return 0.6;
  } else if (gradient > 0.02) { // Moderate uphill (2-5%)
    return 0.8;
  } else if (gradient < -0.05) { // Steep downhill (<-5%)
    return 1.2;
  } else if (gradient < -0.02) { // Moderate downhill (-2% to -5%)
    return 1.1;
  }

  return 1; // Flat terrain
}

// Generate GPX XML from track points
function generateGPXXML(
  name: string,
  description: string,
  activityType: string,
  points: GPXPoint[],
  startTime: Date
): string {
  const formatDate = (date: Date) => date.toISOString();

  const trackPoints = points.map((point) => {
    const elevationTag = point.elevation !== undefined ? `<ele>${point.elevation}</ele>` : '';
    const timeTag = point.time ? `<time>${formatDate(point.time)}</time>` : '';

    return `    <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lng.toFixed(6)}">
      ${elevationTag}
      ${timeTag}
    </trkpt>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Route Creator" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>
    <time>${formatDate(startTime)}</time>
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <type>${escapeXml(activityType)}</type>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

// Helper function to escape XML characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Utility function to convert pace to speed
export function paceToSpeed(paceMinPerKm: number): number {
  return 60 / paceMinPerKm;
}

// Utility function to convert speed to pace
export function speedToPace(speedKmh: number): number {
  return 60 / speedKmh;
}

// Utility function to format pace for display
export function formatPace(paceMinPerKm: number): string {
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}

// Utility function to format duration
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Legacy route interface for backward compatibility
interface LegacyRoute {
  name: string;
  description?: string;
  activityType: string;
  points?: Array<{ lng: number; lat: number }>;
  coordinates?: [number, number][];
  createdAt?: Date;
}

// Legacy function for backward compatibility
export function generateGPX(route: LegacyRoute): string {
  // Convert legacy route format to new format
  const options: GPXGenerationOptions = {
    name: route.name,
    description: route.description,
    activityType: route.activityType === 'running' ? 'Run' :
                  route.activityType === 'cycling' ? 'Bike' : 'Walk',
    coordinates: route.points?.map((p) => [p.lng, p.lat]) ||
                 route.coordinates || [],
    startTime: route.createdAt || new Date(),
  };

  return generateGpx(options);
}

// Enhanced download function with options
export async function downloadGpx(options: GPXGenerationOptions): Promise<void> {
  const gpxContent = await generateGpx(options);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Legacy download function for backward compatibility
export function downloadGPX(route: LegacyRoute): void {
  const options: GPXGenerationOptions = {
    name: route.name,
    description: route.description,
    activityType: route.activityType === 'running' ? 'Run' :
                  route.activityType === 'cycling' ? 'Bike' : 'Walk',
    coordinates: route.points?.map((p) => [p.lng, p.lat]) ||
                 route.coordinates || [],
    startTime: route.createdAt || new Date(),
  };

  downloadGpx(options);
}

export function estimateActivityDuration(
  distance: number,
  activityType: 'running' | 'cycling' | 'walking'
): number {
  // Average speeds in km/h
  const averageSpeeds = {
    running: 10,
    cycling: 20,
    walking: 5,
  };

  const distanceKm = distance / 1000;
  const hours = distanceKm / averageSpeeds[activityType];
  return Math.round(hours * 3600); // Convert to seconds
}

// Utility function to validate speed for activity type
export function isValidSpeed(speed: number, activityType: 'Run' | 'Bike'): boolean {
  if (activityType === 'Run') {
    return speed >= 3 && speed <= 25;
  } else if (activityType === 'Bike') {
    return speed >= 5 && speed <= 60;
  }
  return false;
}

// Utility function to validate pace for activity type
export function isValidPace(pace: number, activityType: 'Run' | 'Bike'): boolean {
  if (activityType === 'Run') {
    return pace >= 2.4 && pace <= 20; // Equivalent to 3-25 km/h
  } else if (activityType === 'Bike') {
    return pace >= 1 && pace <= 12; // Equivalent to 5-60 km/h
  }
  return false;
}

// Utility function to get default speed for activity type
export function getDefaultSpeed(activityType: 'Run' | 'Bike'): number {
  return activityType === 'Run' ? 10 : 20;
}

// Utility function to get default pace for activity type
export function getDefaultPace(activityType: 'Run' | 'Bike'): number {
  return activityType === 'Run' ? 6 : 3;
}

// Haversine distance calculation function
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// ============================================================================
// ELEVATION API INTEGRATION
// ============================================================================

type Point = { lat: number; lng: number };
type PointWithElevation = Point & { ele: number };

interface OpenElevationRequest {
  locations: Array<{ latitude: number; longitude: number }>;
}

interface OpenElevationResponse {
  results: Array<{
    latitude: number;
    longitude: number;
    elevation: number;
  }>;
}

/**
 * Production-ready function to enrich GPS points with real elevation data
 * Uses Open-Elevation API with error handling, retries, and fallbacks
 *
 * @param points Array of GPS coordinates
 * @returns Promise of points enriched with elevation data
 */
export async function addElevationToPoints(points: Point[]): Promise<PointWithElevation[]> {
  if (points.length === 0) {
    return [];
  }

  // Limit batch size to avoid API limits (Open-Elevation recommends max 1024 points)
  const BATCH_SIZE = 100;
  const enrichedPoints: PointWithElevation[] = [];

  // Process points in batches
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);
    const batchResults = await fetchElevationBatch(batch);
    enrichedPoints.push(...batchResults);
  }

  return enrichedPoints;
}

/**
 * Fetches elevation data for a batch of points with retry logic
 */
async function fetchElevationBatch(points: Point[]): Promise<PointWithElevation[]> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add delay between retries to handle rate limiting
      if (attempt > 0) {
        await delay(1000 * attempt); // 1s, 2s delays
      }

      const result = await callOpenElevationAPI(points);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Elevation API attempt ${attempt + 1} failed:`, error);

      // If it's a rate limit error, wait longer before retry
      if (error instanceof Error && error.message.includes('429')) {
        await delay(5000); // Wait 5 seconds for rate limit
      }
    }
  }

  // All retries failed, use fallback elevation
  console.error('All elevation API attempts failed, using fallback:', lastError);
  return generateFallbackElevation(points);
}

/**
 * Calls the Open-Elevation API through our server-side proxy
 */
async function callOpenElevationAPI(points: Point[]): Promise<PointWithElevation[]> {
  const requestBody: OpenElevationRequest = {
    locations: points.map(point => ({
      latitude: point.lat,
      longitude: point.lng
    }))
  };

  const response = await fetch('/api/elevation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000) // 30 second timeout
  });

  if (!response.ok) {
    throw new Error(`Elevation API proxy error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Check if this is a fallback response
  if (data.fallback) {
    console.warn('Using fallback elevation data:', data.message);
  }

  // Validate response structure
  if (!data.results || !Array.isArray(data.results)) {
    throw new Error('Invalid elevation API response format');
  }

  if (data.results.length !== points.length) {
    throw new Error(`Elevation API returned ${data.results.length} results for ${points.length} points`);
  }

  // Map results back to original points with elevation
  return points.map((point, index) => {
    const result = data.results[index];
    return {
      lat: point.lat,
      lng: point.lng,
      ele: Math.round(result.elevation) // Round to nearest meter
    };
  });
}

/**
 * Generates realistic fallback elevation when API fails
 * Uses a simple terrain model based on latitude/longitude patterns
 */
function generateFallbackElevation(points: Point[]): PointWithElevation[] {
  return points.map((point, index) => {
    // Generate realistic elevation based on geographic patterns
    const baseElevation = 100; // Base sea level offset

    // Add some geographic variation (higher elevations inland, lower near coasts)
    const latVariation = Math.abs(point.lat) * 2; // Higher latitudes tend to be more mountainous
    const lngVariation = Math.sin(point.lng * Math.PI / 180) * 50; // Longitude-based variation

    // Add some randomness for terrain variation
    const randomVariation = (Math.random() - 0.5) * 100;

    // Add gradual elevation changes along the route
    const routeProgression = index * 2; // Gradual elevation gain along route

    const elevation = Math.max(0,
      baseElevation + latVariation + lngVariation + randomVariation + routeProgression
    );

    return {
      lat: point.lat,
      lng: point.lng,
      ele: Math.round(elevation)
    };
  });
}

/**
 * Utility function for delays
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// REALISTIC TIMESTAMP GENERATION WITH HUMAN-LIKE PACING
// ============================================================================

interface RealisticTimestampOptions {
  avgSpeedKmh: number;
  startTime: Date;
  samplingRateSeconds?: number; // GPS sampling rate (default: 4 seconds)
  speedVariation?: number; // Speed variation factor (default: 0.15 = 15%)
  activityType?: 'Run' | 'Bike' | 'Walk';
  addElevation?: boolean;
  elevationGain?: number;
  useRealElevation?: boolean; // Use real elevation API instead of simulated
}

interface TimestampedPoint {
  lat: number;
  lng: number;
  time: Date;
  speed?: number; // km/h
  elevation?: number; // meters
}

/**
 * Generates realistic timestamps for GPS points with human-like pacing variations
 *
 * Design choices:
 * - Uses Gaussian distribution for speed variation around base speed
 * - Implements pacing patterns: slow start, peak middle, gradual fatigue
 * - Maintains consistent GPS sampling rate (3-5 seconds typical)
 * - Ensures monotonically increasing timestamps
 * - Adds realistic elevation changes if requested
 */
export async function generateRealisticTimestamps(
  points: { lat: number; lng: number }[],
  options: RealisticTimestampOptions
): Promise<TimestampedPoint[]> {
  const {
    avgSpeedKmh,
    startTime,
    samplingRateSeconds = 4,
    speedVariation = 0.15,
    activityType = 'Run',
    addElevation = false,
    elevationGain = 0,
    useRealElevation = false
  } = options;

  if (points.length < 2) {
    return points.map(point => ({
      ...point,
      time: new Date(startTime),
      speed: avgSpeedKmh,
      elevation: addElevation ? 100 : undefined
    }));
  }

  // Get real elevation data if requested
  let pointsWithElevation: PointWithElevation[] = [];
  if (addElevation && useRealElevation) {
    try {
      pointsWithElevation = await addElevationToPoints(points);
    } catch (error) {
      console.warn('Failed to fetch real elevation data, using simulated elevation:', error);
      // Fall back to simulated elevation
      pointsWithElevation = points.map(point => ({ ...point, ele: 100 }));
    }
  }

  const result: TimestampedPoint[] = [];
  let currentTime = new Date(startTime);
  let totalDistance = 0;
  let cumulativeElevation = 0;

  // Calculate total route distance for pacing patterns
  const totalRouteDistance = calculateRouteDistance(points);

  // Generate pacing multiplier curve (slow start, peak middle, gradual end)
  const pacingCurve = generatePacingCurve(points.length, activityType);

  // Add first point
  result.push({
    ...points[0],
    time: new Date(currentTime),
    speed: avgSpeedKmh,
    elevation: addElevation ? getStartingElevation() : undefined
  });

  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];

    // Calculate segment distance
    const segmentDistance = haversineDistance(
      prevPoint.lat, prevPoint.lng,
      currentPoint.lat, currentPoint.lng
    );

    totalDistance += segmentDistance;

    // Get pacing multiplier for this segment
    const pacingMultiplier = pacingCurve[i];

    // Generate realistic speed with variation
    const baseSpeed = avgSpeedKmh * pacingMultiplier;
    const speedWithVariation = addSpeedVariation(baseSpeed, speedVariation);

    // Calculate time for this segment
    const segmentTimeHours = segmentDistance / speedWithVariation;
    const segmentTimeMs = segmentTimeHours * 3600 * 1000;

    // Ensure minimum sampling rate
    const minTimeMs = samplingRateSeconds * 1000;
    const actualTimeMs = Math.max(segmentTimeMs, minTimeMs);

    currentTime = new Date(currentTime.getTime() + actualTimeMs);

    // Calculate elevation if requested
    let elevation: number | undefined;
    if (addElevation) {
      if (useRealElevation && pointsWithElevation.length > 0) {
        // Use real elevation data from API
        elevation = pointsWithElevation[i]?.ele || 100;
      } else {
        // Use simulated elevation
        const progressRatio = totalDistance / totalRouteDistance;
        elevation = calculateRealisticElevation(
          cumulativeElevation,
          progressRatio,
          elevationGain,
          totalRouteDistance
        );
        cumulativeElevation = elevation;
      }
    }

    result.push({
      ...currentPoint,
      time: new Date(currentTime),
      speed: speedWithVariation,
      elevation
    });
  }

  return result;
}

/**
 * Generates a pacing curve that simulates human activity patterns
 * - Slow start (warmup): 85-90% of target speed
 * - Peak middle: 100-110% of target speed
 * - Gradual fatigue: 90-95% of target speed
 */
function generatePacingCurve(pointCount: number, activityType: 'Run' | 'Bike' | 'Walk'): number[] {
  const curve: number[] = [];

  // Activity-specific pacing patterns
  const patterns = {
    'Run': { warmup: 0.85, peak: 1.08, fatigue: 0.92 },
    'Bike': { warmup: 0.90, peak: 1.05, fatigue: 0.95 },
    'Walk': { warmup: 0.95, peak: 1.02, fatigue: 0.98 }
  };

  const pattern = patterns[activityType];

  for (let i = 0; i < pointCount; i++) {
    const progress = i / (pointCount - 1); // 0 to 1

    let multiplier: number;

    if (progress < 0.2) {
      // Warmup phase (first 20%)
      const warmupProgress = progress / 0.2;
      multiplier = pattern.warmup + (1 - pattern.warmup) * warmupProgress;
    } else if (progress < 0.7) {
      // Peak phase (20% to 70%)
      const peakProgress = (progress - 0.2) / 0.5;
      // Sine wave for natural variation in peak phase
      const sineVariation = Math.sin(peakProgress * Math.PI * 2) * 0.03;
      multiplier = pattern.peak + sineVariation;
    } else {
      // Fatigue phase (70% to 100%)
      const fatigueProgress = (progress - 0.7) / 0.3;
      multiplier = pattern.peak - (pattern.peak - pattern.fatigue) * fatigueProgress;
    }

    curve.push(multiplier);
  }

  return curve;
}

/**
 * Adds realistic speed variation using Gaussian distribution
 * This simulates natural human pace fluctuations
 */
function addSpeedVariation(baseSpeed: number, variationFactor: number): number {
  // Generate Gaussian random number (Box-Muller transform)
  const u1 = Math.random();
  const u2 = Math.random();
  const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Apply variation (clamped to reasonable bounds)
  const variation = gaussian * variationFactor;
  const speedWithVariation = baseSpeed * (1 + variation);

  // Ensure speed doesn't go below 20% or above 180% of base speed
  const minSpeed = baseSpeed * 0.2;
  const maxSpeed = baseSpeed * 1.8;

  return Math.max(minSpeed, Math.min(maxSpeed, speedWithVariation));
}

/**
 * Calculates realistic elevation changes along the route
 * Uses a combination of gradual slope and random variation
 */
function calculateRealisticElevation(
  currentElevation: number,
  progressRatio: number,
  totalElevationGain: number,
  totalDistance: number
): number {
  // Base elevation from gradual slope
  const targetElevation = 100 + (totalElevationGain * progressRatio);

  // Add realistic variation (±5-15m random changes)
  const variation = (Math.random() - 0.5) * 20;

  // Smooth transition to avoid sudden jumps
  const smoothingFactor = 0.7;
  const newElevation = currentElevation * smoothingFactor +
                      (targetElevation + variation) * (1 - smoothingFactor);

  // Ensure elevation doesn't go negative
  return Math.max(0, newElevation);
}

/**
 * Gets a realistic starting elevation (typically 50-200m)
 */
function getStartingElevation(): number {
  return 50 + Math.random() * 150;
}

/**
 * Helper function to calculate total distance of a route for realistic timing
 */
function calculateRouteDistance(points: { lat: number; lng: number }[]): number {
  let totalDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const distance = haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
    totalDistance += distance;
  }

  return totalDistance;
}

/**
 * Converts timestamped points to GPX track points XML
 */
export function timestampedPointsToGPX(
  points: TimestampedPoint[],
  name: string,
  description: string = '',
  activityType: string = 'Run'
): string {
  const formatDate = (date: Date) => date.toISOString();

  const trackPoints = points.map(point => {
    const elevationAttr = point.elevation !== undefined ? `
      <ele>${point.elevation.toFixed(1)}</ele>` : '';

    return `      <trkpt lat="${point.lat.toFixed(7)}" lon="${point.lng.toFixed(7)}">
        <time>${formatDate(point.time)}</time>${elevationAttr}
      </trkpt>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Realistic GPX Generator" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>
    <time>${formatDate(points[0]?.time || new Date())}</time>
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <type>${escapeXml(activityType)}</type>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

/**
 * Enhanced GPX generation with realistic timestamps
 * This is the main function to use for generating realistic GPX files
 */
export async function generateRealisticGPX(
  points: { lat: number; lng: number }[],
  options: RealisticTimestampOptions & {
    name: string;
    description?: string;
  }
): Promise<string> {
  // Generate realistic timestamps
  const timestampedPoints = await generateRealisticTimestamps(points, options);

  // Convert to GPX format
  return timestampedPointsToGPX(
    timestampedPoints,
    options.name,
    options.description || `${options.activityType || 'Run'} activity`,
    options.activityType || 'Run'
  );
}

/**
 * Download function for realistic GPX
 */
export async function downloadRealisticGPX(
  points: { lat: number; lng: number }[],
  options: RealisticTimestampOptions & {
    name: string;
    description?: string;
  }
): Promise<void> {
  const gpxContent = await generateRealisticGPX(points, options);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
