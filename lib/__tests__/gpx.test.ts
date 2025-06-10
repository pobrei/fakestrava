import {
  generateGpx,
  GPXGenerationOptions,
  paceToSpeed,
  speedToPace,
  formatPace,
  formatDuration,
} from '../gpx';

// Mock coordinates for testing (NYC Central Park loop)
const mockCoordinates: [number, number][] = [
  [-73.9857, 40.7829], // Start
  [-73.9857, 40.7849], // North
  [-73.9737, 40.7849], // Northeast
  [-73.9737, 40.7829], // East
  [-73.9737, 40.7809], // Southeast
  [-73.9857, 40.7809], // South
  [-73.9857, 40.7829], // Back to start
];

describe('GPX Generation', () => {
  describe('generateGpx', () => {
    it('should generate valid GPX with basic options', () => {
      const options: GPXGenerationOptions = {
        name: 'Test Run',
        activityType: 'Run',
        coordinates: mockCoordinates,
      };

      const gpx = generateGpx(options);

      expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(gpx).toContain('<gpx version="1.1"');
      expect(gpx).toContain('<name>Test Run</name>');
      expect(gpx).toContain('<type>Run</type>');
      expect(gpx).toContain('<trkpt');
      expect(gpx).toContain('lat="40.782900"');
      expect(gpx).toContain('lon="-73.985700"');
    });

    it('should include timestamps when specified', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const options: GPXGenerationOptions = {
        name: 'Test Run',
        activityType: 'Run',
        coordinates: mockCoordinates,
        startTime,
        averageSpeedKmh: 10,
      };

      const gpx = generateGpx(options);

      expect(gpx).toContain('<time>2024-01-01T10:00:00.000Z</time>');
      expect(gpx).toContain('<time>'); // Should have multiple timestamps
    });

    it('should include elevation when specified', () => {
      const options: GPXGenerationOptions = {
        name: 'Test Run',
        activityType: 'Run',
        coordinates: mockCoordinates,
        elevationGain: 100,
        elevationProfile: 'hilly',
      };

      const gpx = generateGpx(options);

      expect(gpx).toContain('<ele>');
    });

    it('should handle different activity types', () => {
      const runOptions: GPXGenerationOptions = {
        name: 'Test Run',
        activityType: 'Run',
        coordinates: mockCoordinates,
      };

      const bikeOptions: GPXGenerationOptions = {
        name: 'Test Bike',
        activityType: 'Bike',
        coordinates: mockCoordinates,
      };

      const runGpx = generateGpx(runOptions);
      const bikeGpx = generateGpx(bikeOptions);

      expect(runGpx).toContain('<type>Run</type>');
      expect(bikeGpx).toContain('<type>Bike</type>');
    });

    it('should use pace when specified instead of speed', () => {
      const options: GPXGenerationOptions = {
        name: 'Test Run',
        activityType: 'Run',
        coordinates: mockCoordinates,
        averagePaceMinPerKm: 5, // 5 min/km = 12 km/h
        startTime: new Date('2024-01-01T10:00:00Z'),
      };

      const gpx = generateGpx(options);
      
      // Should contain timestamps (indicating speed calculation worked)
      expect(gpx).toContain('<time>');
      
      // Parse timestamps to verify timing is reasonable
      const timeMatches = gpx.match(/<time>([^<]+)<\/time>/g);
      expect(timeMatches).toBeTruthy();
      expect(timeMatches!.length).toBeGreaterThan(1);
    });

    it('should escape XML characters in names and descriptions', () => {
      const options: GPXGenerationOptions = {
        name: 'Test & Run <with> "quotes"',
        description: 'A run with & special < characters > and "quotes"',
        activityType: 'Run',
        coordinates: mockCoordinates,
      };

      const gpx = generateGpx(options);

      expect(gpx).toContain('Test &amp; Run &lt;with&gt; &quot;quotes&quot;');
      expect(gpx).toContain('A run with &amp; special &lt; characters &gt; and &quot;quotes&quot;');
    });

    it('should handle empty coordinates gracefully', () => {
      const options: GPXGenerationOptions = {
        name: 'Empty Route',
        activityType: 'Run',
        coordinates: [],
      };

      const gpx = generateGpx(options);

      expect(gpx).toContain('<gpx');
      expect(gpx).toContain('<trkseg>');
      expect(gpx).toContain('</trkseg>');
    });

    it('should handle single coordinate', () => {
      const options: GPXGenerationOptions = {
        name: 'Single Point',
        activityType: 'Run',
        coordinates: [[-73.9857, 40.7829]],
      };

      const gpx = generateGpx(options);

      expect(gpx).toContain('<trkpt lat="40.782900" lon="-73.985700">');
    });
  });

  describe('Utility Functions', () => {
    describe('paceToSpeed', () => {
      it('should convert pace to speed correctly', () => {
        expect(paceToSpeed(6)).toBeCloseTo(10, 1); // 6 min/km = 10 km/h
        expect(paceToSpeed(5)).toBeCloseTo(12, 1); // 5 min/km = 12 km/h
        expect(paceToSpeed(4)).toBeCloseTo(15, 1); // 4 min/km = 15 km/h
      });
    });

    describe('speedToPace', () => {
      it('should convert speed to pace correctly', () => {
        expect(speedToPace(10)).toBeCloseTo(6, 1); // 10 km/h = 6 min/km
        expect(speedToPace(12)).toBeCloseTo(5, 1); // 12 km/h = 5 min/km
        expect(speedToPace(15)).toBeCloseTo(4, 1); // 15 km/h = 4 min/km
      });
    });

    describe('formatPace', () => {
      it('should format pace correctly', () => {
        expect(formatPace(5)).toBe('5:00 min/km');
        expect(formatPace(5.5)).toBe('5:30 min/km');
        expect(formatPace(4.25)).toBe('4:15 min/km');
      });
    });

    describe('formatDuration', () => {
      it('should format duration correctly', () => {
        expect(formatDuration(3661)).toBe('1:01:01'); // 1 hour, 1 minute, 1 second
        expect(formatDuration(125)).toBe('2:05'); // 2 minutes, 5 seconds
        expect(formatDuration(59)).toBe('0:59'); // 59 seconds
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short routes', () => {
      const options: GPXGenerationOptions = {
        name: 'Short Route',
        activityType: 'Run',
        coordinates: [
          [-73.9857, 40.7829],
          [-73.9857, 40.7830], // Very close point
        ],
        averageSpeedKmh: 10,
      };

      const gpx = generateGpx(options);
      expect(gpx).toContain('<trkpt');
    });

    it('should handle very slow speeds', () => {
      const options: GPXGenerationOptions = {
        name: 'Slow Walk',
        activityType: 'Walk',
        coordinates: mockCoordinates,
        averageSpeedKmh: 1, // Very slow
      };

      const gpx = generateGpx(options);
      expect(gpx).toContain('<time>');
    });

    it('should handle very fast speeds', () => {
      const options: GPXGenerationOptions = {
        name: 'Fast Bike',
        activityType: 'Bike',
        coordinates: mockCoordinates,
        averageSpeedKmh: 50, // Very fast
      };

      const gpx = generateGpx(options);
      expect(gpx).toContain('<time>');
    });
  });
});
