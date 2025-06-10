# Realistic GPX Generation Usage Examples

This document demonstrates how to use the enhanced realistic GPX generation functions with human-like pacing variations, realistic timestamps, and elevation data.

## Basic Usage

```typescript
import { 
  generateRealisticTimestamps, 
  generateRealisticGPX, 
  downloadRealisticGPX 
} from '@/lib/gpx';

// Sample route points (NYC Central Park loop)
const routePoints = [
  { lat: 40.7829, lng: -73.9857 }, // Start
  { lat: 40.7849, lng: -73.9857 }, // North
  { lat: 40.7849, lng: -73.9737 }, // Northeast
  { lat: 40.7829, lng: -73.9737 }, // East
  { lat: 40.7809, lng: -73.9737 }, // Southeast
  { lat: 40.7809, lng: -73.9857 }, // South
  { lat: 40.7829, lng: -73.9857 }, // Back to start
];

// Basic realistic GPX generation
const basicOptions = {
  avgSpeedKmh: 12,
  startTime: new Date('2024-01-15T08:00:00Z'),
  name: 'Morning Run in Central Park',
  description: 'A realistic morning jog with natural pacing variations'
};

const gpxContent = generateRealisticGPX(routePoints, basicOptions);
```

## Advanced Configuration

```typescript
// Advanced options with custom pacing and elevation
const advancedOptions = {
  avgSpeedKmh: 15,
  startTime: new Date('2024-01-15T18:30:00Z'),
  name: 'Evening Bike Ride',
  description: 'Cycling with hills and realistic pacing',
  activityType: 'Bike' as const,
  samplingRateSeconds: 3, // GPS point every 3 seconds
  speedVariation: 0.2, // 20% speed variation
  addElevation: true,
  elevationGain: 150 // 150m total elevation gain
};

// Generate and download
downloadRealisticGPX(routePoints, advancedOptions);
```

## Just Generate Timestamps

```typescript
// If you only need timestamped points (not full GPX)
const timestampedPoints = generateRealisticTimestamps(routePoints, {
  avgSpeedKmh: 10,
  startTime: new Date(),
  activityType: 'Run',
  speedVariation: 0.15,
  samplingRateSeconds: 4
});

// Each point now has: { lat, lng, time, speed?, elevation? }
console.log(timestampedPoints[0]);
// Output: { lat: 40.7829, lng: -73.9857, time: 2024-01-15T08:00:00.000Z, speed: 9.8 }
```

## Design Choices Explained

### 1. **Pacing Patterns**
- **Warmup (0-20%)**: 85-90% of target speed (slow start)
- **Peak (20-70%)**: 100-110% of target speed with sine wave variation
- **Fatigue (70-100%)**: 90-95% of target speed (gradual slowdown)

### 2. **Speed Variation**
- Uses Gaussian distribution (Box-Muller transform)
- Default 15% variation factor
- Clamped between 20% and 180% of base speed

### 3. **GPS Sampling Rate**
- Default 4 seconds between points (realistic for fitness devices)
- Ensures minimum time intervals even for short segments
- Maintains monotonically increasing timestamps

### 4. **Elevation Simulation**
- Gradual slope based on total elevation gain
- Random variation (±10m) for realism
- Smoothing to avoid sudden elevation jumps
- Starting elevation: 50-200m (realistic range)

### 5. **Activity-Specific Patterns**
- **Running**: More variation, stronger fatigue pattern
- **Cycling**: Smoother pacing, less fatigue
- **Walking**: Minimal variation, steady pace

## Integration with Existing Code

```typescript
// Update existing GPX generation to use realistic timestamps
import { generateGpx, GPXGenerationOptions } from '@/lib/gpx';

// Enhanced GPX generation function
function generateEnhancedGPX(options: GPXGenerationOptions & {
  useRealisticTiming?: boolean;
}): string {
  if (options.useRealisticTiming) {
    return generateRealisticGPX(
      options.coordinates.map(([lng, lat]) => ({ lat, lng })),
      {
        avgSpeedKmh: options.averageSpeedKmh || 10,
        startTime: options.startTime || new Date(),
        name: options.name,
        description: options.description,
        activityType: options.activityType,
        addElevation: options.elevationGain ? true : false,
        elevationGain: options.elevationGain
      }
    );
  }
  
  // Fall back to existing generation
  return generateGpx(options);
}
```

## Performance Considerations

- **Memory**: Minimal overhead, processes points sequentially
- **CPU**: Gaussian random generation is lightweight
- **Scalability**: Linear time complexity O(n) where n = number of points
- **Production Ready**: Includes error handling and input validation

## Example Output

The generated GPX will include realistic timestamps like:

```xml
<trkpt lat="40.7829000" lon="-73.9857000">
  <time>2024-01-15T08:00:00.000Z</time>
  <ele>127.3</ele>
</trkpt>
<trkpt lat="40.7849000" lon="-73.9857000">
  <time>2024-01-15T08:00:47.000Z</time>
  <ele>132.1</ele>
</trkpt>
```

Each point will have:
- Realistic time intervals based on distance and speed
- Natural speed variations
- Smooth elevation changes
- Human-like pacing patterns
