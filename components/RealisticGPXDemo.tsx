'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  generateRealisticGPX, 
  downloadRealisticGPX, 
  generateRealisticTimestamps 
} from '@/lib/gpx';
import { toast } from 'sonner';

// Sample route data (NYC Central Park loop)
const sampleRoute = [
  { lat: 40.7829, lng: -73.9857 }, // Start
  { lat: 40.7849, lng: -73.9857 }, // North
  { lat: 40.7849, lng: -73.9737 }, // Northeast
  { lat: 40.7829, lng: -73.9737 }, // East
  { lat: 40.7809, lng: -73.9737 }, // Southeast
  { lat: 40.7809, lng: -73.9857 }, // South
  { lat: 40.7829, lng: -73.9857 }, // Back to start
];

export default function RealisticGPXDemo() {
  const [options, setOptions] = useState({
    name: 'Realistic Activity Demo',
    description: 'Generated with human-like pacing patterns',
    avgSpeedKmh: 12,
    activityType: 'Run' as 'Run' | 'Bike' | 'Walk',
    speedVariation: 0.15,
    samplingRateSeconds: 4,
    addElevation: true,
    elevationGain: 50
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const startTime = new Date();
      
      // Generate realistic timestamps for preview
      const timestampedPoints = generateRealisticTimestamps(sampleRoute, {
        avgSpeedKmh: options.avgSpeedKmh,
        startTime,
        activityType: options.activityType,
        speedVariation: options.speedVariation,
        samplingRateSeconds: options.samplingRateSeconds,
        addElevation: options.addElevation,
        elevationGain: options.elevationGain
      });

      // Calculate some stats for preview
      const totalTime = timestampedPoints[timestampedPoints.length - 1].time.getTime() - timestampedPoints[0].time.getTime();
      const avgSpeed = timestampedPoints.reduce((sum, p) => sum + (p.speed || 0), 0) / timestampedPoints.length;
      
      setPreviewData({
        points: timestampedPoints.length,
        duration: Math.round(totalTime / 1000), // seconds
        avgSpeed: avgSpeed.toFixed(1),
        elevationRange: options.addElevation ? 
          `${Math.min(...timestampedPoints.map(p => p.elevation || 0)).toFixed(0)}m - ${Math.max(...timestampedPoints.map(p => p.elevation || 0)).toFixed(0)}m` : 
          'None'
      });

      toast.success('Realistic GPX preview generated!', {
        description: `${timestampedPoints.length} points with human-like pacing`
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const startTime = new Date();
      
      downloadRealisticGPX(sampleRoute, {
        ...options,
        startTime
      });

      toast.success('Realistic GPX downloaded!', {
        description: `${options.name} with realistic timing patterns`
      });
    } catch (error) {
      console.error('Error downloading GPX:', error);
      toast.error('Failed to download GPX');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🏃 Realistic GPX Generator Demo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate GPX files with human-like pacing patterns, realistic timestamps, and elevation data
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Activity Name</Label>
            <Input
              id="name"
              value={options.name}
              onChange={(e) => setOptions(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="activity-type">Activity Type</Label>
            <Select 
              value={options.activityType} 
              onValueChange={(value: 'Run' | 'Bike' | 'Walk') => 
                setOptions(prev => ({ ...prev, activityType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Run">🏃 Running</SelectItem>
                <SelectItem value="Bike">🚴 Cycling</SelectItem>
                <SelectItem value="Walk">🚶 Walking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Speed and Timing */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="speed">Avg Speed (km/h)</Label>
            <Input
              id="speed"
              type="number"
              min="1"
              max="50"
              step="0.5"
              value={options.avgSpeedKmh}
              onChange={(e) => setOptions(prev => ({ ...prev, avgSpeedKmh: parseFloat(e.target.value) || 12 }))}
            />
          </div>
          <div>
            <Label htmlFor="variation">Speed Variation</Label>
            <Input
              id="variation"
              type="number"
              min="0.05"
              max="0.5"
              step="0.05"
              value={options.speedVariation}
              onChange={(e) => setOptions(prev => ({ ...prev, speedVariation: parseFloat(e.target.value) || 0.15 }))}
            />
          </div>
          <div>
            <Label htmlFor="sampling">GPS Rate (sec)</Label>
            <Input
              id="sampling"
              type="number"
              min="1"
              max="10"
              value={options.samplingRateSeconds}
              onChange={(e) => setOptions(prev => ({ ...prev, samplingRateSeconds: parseInt(e.target.value) || 4 }))}
            />
          </div>
        </div>

        {/* Elevation Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="elevation"
              checked={options.addElevation}
              onChange={(e) => setOptions(prev => ({ ...prev, addElevation: e.target.checked }))}
            />
            <Label htmlFor="elevation">Add Elevation Data</Label>
          </div>
          {options.addElevation && (
            <div>
              <Label htmlFor="elevation-gain">Elevation Gain (m)</Label>
              <Input
                id="elevation-gain"
                type="number"
                min="0"
                max="1000"
                value={options.elevationGain}
                onChange={(e) => setOptions(prev => ({ ...prev, elevationGain: parseInt(e.target.value) || 50 }))}
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={options.description}
            onChange={(e) => setOptions(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Activity description..."
          />
        </div>

        {/* Preview Data */}
        {previewData && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">📊 Preview Stats</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Points: {previewData.points}</div>
              <div>Duration: {Math.floor(previewData.duration / 60)}:{(previewData.duration % 60).toString().padStart(2, '0')}</div>
              <div>Avg Speed: {previewData.avgSpeed} km/h</div>
              <div>Elevation: {previewData.elevationRange}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            variant="outline"
            className="flex-1"
          >
            {isGenerating ? 'Generating...' : '🔍 Preview'}
          </Button>
          <Button 
            onClick={handleDownload}
            className="flex-1"
          >
            📥 Download Realistic GPX
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Uses Central Park sample route (7 points, ~2km loop)</p>
          <p>• Includes warmup, peak performance, and fatigue patterns</p>
          <p>• Gaussian speed variation for natural human movement</p>
          <p>• Realistic GPS sampling rate and elevation changes</p>
        </div>
      </CardContent>
    </Card>
  );
}
