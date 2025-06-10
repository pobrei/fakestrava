# GPX Generation Usage Examples

This document demonstrates how to use the enhanced GPX generation function with timestamps, elevation, and activity types.

## Basic Usage

```typescript
import { generateGpx, downloadGpx, GPXGenerationOptions } from '@/lib/gpx';

// Basic route coordinates (NYC Central Park loop)
const coordinates: [number, number][] = [
  [-73.9857, 40.7829], // Start
  [-73.9857, 40.7849], // North
  [-73.9737, 40.7849], // Northeast
  [-73.9737, 40.7829], // East
  [-73.9737, 40.7809], // Southeast
  [-73.9857, 40.7809], // South
  [-73.9857, 40.7829], // Back to start
];

// Basic GPX generation
const basicOptions: GPXGenerationOptions = {
  name: 'Central Park Loop',
  activityType: 'Run',
  coordinates,
};

const gpxContent = generateGpx(basicOptions);
console.log(gpxContent); // Valid GPX XML
```

## Advanced Usage with Timestamps

```typescript
// Running with pace-based timestamps
const runningOptions: GPXGenerationOptions = {
  name: 'Morning Run',
  description: 'Easy morning jog around Central Park',
  activityType: 'Run',
  coordinates,
  startTime: new Date('2024-01-15T07:00:00Z'),
  averagePaceMinPerKm: 5.5, // 5:30 min/km pace
  addNoise: true, // Add realistic speed variations
  pauseDuration: 30, // Occasional 30-second pauses
};

downloadGpx(runningOptions); // Downloads GPX file
```

## Cycling with Speed and Elevation

```typescript
// Cycling with speed-based timestamps and elevation
const cyclingOptions: GPXGenerationOptions = {
  name: 'Hill Training Ride',
  description: 'Challenging hill training session',
  activityType: 'Bike',
  coordinates,
  startTime: new Date('2024-01-15T14:00:00Z'),
  averageSpeedKmh: 25, // 25 km/h average speed
  elevationGain: 200, // 200m total elevation gain
  elevationProfile: 'hilly', // Hilly terrain
  addNoise: true,
};

const gpxContent = generateGpx(cyclingOptions);
```

## Mountainous Route with Custom Settings

```typescript
// Mountain biking with extreme elevation
const mountainOptions: GPXGenerationOptions = {
  name: 'Mountain Challenge',
  description: 'Epic mountain bike adventure',
  activityType: 'Bike',
  coordinates,
  startTime: new Date(),
  averageSpeedKmh: 15, // Slower due to terrain
  elevationGain: 800, // 800m elevation gain
  elevationProfile: 'mountainous',
  addNoise: true,
  pauseDuration: 120, // Longer breaks for mountain biking
};

downloadGpx(mountainOptions);
```

## Utility Functions

```typescript
import { 
  paceToSpeed, 
  speedToPace, 
  formatPace, 
  formatDuration 
} from '@/lib/gpx';

// Convert between pace and speed
const speed = paceToSpeed(5.5); // 5:30 min/km → 10.91 km/h
const pace = speedToPace(12); // 12 km/h → 5 min/km

// Format for display
const paceString = formatPace(5.5); // "5:30 min/km"
const durationString = formatDuration(3661); // "1:01:01"
```

## React Component Integration

```typescript
import { useState } from 'react';
import { generateGpx, downloadGpx, GPXGenerationOptions } from '@/lib/gpx';

function GPXExporter({ coordinates }: { coordinates: [number, number][] }) {
  const [options, setOptions] = useState<Partial<GPXGenerationOptions>>({
    name: 'My Route',
    activityType: 'Run',
    averageSpeedKmh: 10,
  });

  const handleExport = () => {
    const fullOptions: GPXGenerationOptions = {
      coordinates,
      startTime: new Date(),
      ...options,
    } as GPXGenerationOptions;

    downloadGpx(fullOptions);
  };

  return (
    <div>
      <input
        value={options.name}
        onChange={(e) => setOptions(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Route name"
      />
      
      <select
        value={options.activityType}
        onChange={(e) => setOptions(prev => ({ 
          ...prev, 
          activityType: e.target.value as 'Run' | 'Bike' 
        }))}
      >
        <option value="Run">Running</option>
        <option value="Bike">Cycling</option>
      </select>

      <button onClick={handleExport}>
        Export GPX
      </button>
    </div>
  );
}
```

## Generated GPX Structure

The generated GPX file includes:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Route Creator" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Morning Run</name>
    <desc>Easy morning jog around Central Park</desc>
    <time>2024-01-15T07:00:00.000Z</time>
  </metadata>
  <trk>
    <name>Morning Run</name>
    <type>Run</type>
    <trkseg>
      <trkpt lat="40.782900" lon="-73.985700">
        <ele>105</ele>
        <time>2024-01-15T07:00:00.000Z</time>
      </trkpt>
      <trkpt lat="40.784900" lon="-73.985700">
        <ele>108</ele>
        <time>2024-01-15T07:01:12.000Z</time>
      </trkpt>
      <!-- More track points with realistic timestamps and elevation -->
    </trkseg>
  </trk>
</gpx>
```

## Features

### Timestamp Generation
- **Speed-based**: Specify `averageSpeedKmh` for consistent speed
- **Pace-based**: Specify `averagePaceMinPerKm` for running activities
- **Realistic variations**: Enable `addNoise` for speed fluctuations
- **Elevation adjustments**: Slower uphill, faster downhill

### Elevation Support
- **Total gain**: Specify `elevationGain` in meters
- **Terrain profiles**: Choose from 'flat', 'hilly', or 'mountainous'
- **Realistic patterns**: Sine wave elevation changes
- **Speed adjustments**: Automatic speed changes based on gradient

### Activity Types
- **Run**: Optimized for running activities with pace support
- **Bike**: Optimized for cycling with higher default speeds
- **Walk**: Optimized for walking activities

### Advanced Features
- **Pauses**: Add realistic breaks with `pauseDuration`
- **Noise**: Add speed variations for realism
- **XML escaping**: Safe handling of special characters
- **Backward compatibility**: Legacy function support

## Testing

Run the comprehensive test suite:

```bash
npm test -- --testPathPattern=gpx
```

Tests cover:
- Basic GPX generation
- Timestamp calculation
- Elevation handling
- Activity type support
- Edge cases and error handling
- Utility function accuracy
