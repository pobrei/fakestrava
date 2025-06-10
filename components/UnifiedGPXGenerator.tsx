'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { 
  generateGpx, 
  downloadGpx, 
  GPXGenerationOptions,
  formatDuration,
  formatPace
} from '@/lib/gpx';
import { useWaypointStore } from '@/lib/store';
import { toast } from 'sonner';

interface GPXFormData {
  name: string;
  description: string;
  activityType: 'Run' | 'Bike' | 'Walk';
  inputType: 'speed' | 'pace';
  averageSpeedKmh: number;
  averagePaceMinPerKm: number;
  elevationGain: number;
  elevationProfile: 'flat' | 'hilly' | 'mountainous';
  addNoise: boolean;
  pauseDuration: number;
  useRealisticTiming: boolean;
  samplingRateSeconds: number;
  speedVariation: number;
  useRealElevation: boolean;
}

export default function UnifiedGPXGenerator() {
  const { waypoints, routeGeometry, totalDistance } = useWaypointStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const [formData, setFormData] = useState<GPXFormData>({
    name: 'My Activity',
    description: 'Generated with realistic timing patterns',
    activityType: 'Run',
    inputType: 'speed',
    averageSpeedKmh: 12,
    averagePaceMinPerKm: 5,
    elevationGain: 50,
    elevationProfile: 'flat',
    addNoise: true,
    pauseDuration: 0,
    useRealisticTiming: true,
    samplingRateSeconds: 4,
    speedVariation: 0.15,
    useRealElevation: false
  });

  const handleInputChange = (field: keyof GPXFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-convert between speed and pace
      if (field === 'inputType') {
        if (value === 'pace' && prev.averageSpeedKmh) {
          newData.averagePaceMinPerKm = Math.round((60 / prev.averageSpeedKmh) * 10) / 10;
        } else if (value === 'speed' && prev.averagePaceMinPerKm) {
          newData.averageSpeedKmh = Math.round((60 / prev.averagePaceMinPerKm) * 10) / 10;
        }
      } else if (field === 'averageSpeedKmh' && prev.inputType === 'speed') {
        newData.averagePaceMinPerKm = Math.round((60 / (value as number)) * 10) / 10;
      } else if (field === 'averagePaceMinPerKm' && prev.inputType === 'pace') {
        newData.averageSpeedKmh = Math.round((60 / (value as number)) * 10) / 10;
      }
      
      return newData;
    });
  };

  const generatePreview = () => {
    if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
      toast.error('Please create a route with at least 2 waypoints first.');
      return;
    }

    const options: GPXGenerationOptions = {
      name: formData.name,
      description: formData.description,
      activityType: formData.activityType,
      coordinates: routeGeometry.coordinates,
      startTime: new Date(),
      elevationGain: formData.elevationGain > 0 ? formData.elevationGain : undefined,
      elevationProfile: formData.elevationProfile,
      addNoise: formData.addNoise,
      pauseDuration: formData.pauseDuration,
      useRealisticTiming: formData.useRealisticTiming,
      samplingRateSeconds: formData.samplingRateSeconds,
      speedVariation: formData.speedVariation,
      useRealElevation: formData.useRealElevation,
    };

    // Add speed or pace
    if (formData.inputType === 'speed') {
      options.averageSpeedKmh = formData.averageSpeedKmh;
    } else {
      options.averagePaceMinPerKm = formData.averagePaceMinPerKm;
    }

    // Calculate preview stats
    const distance = totalDistance;
    const speed = formData.inputType === 'speed' ? formData.averageSpeedKmh : 60 / formData.averagePaceMinPerKm;
    const duration = (distance / speed) * 3600; // seconds
    const points = routeGeometry.coordinates.length;

    setPreviewData({
      distance: distance.toFixed(2),
      duration: formatDuration(duration),
      pace: formatPace(60 / speed),
      speed: speed.toFixed(1),
      points,
      elevationGain: formData.elevationGain,
      realisticTiming: formData.useRealisticTiming
    });

    toast.success('Preview generated!', {
      description: `${points} points, ${distance.toFixed(1)}km route`
    });
  };

  const handleGenerate = async () => {
    if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
      toast.error('Please create a route with at least 2 waypoints first.');
      return;
    }

    setIsGenerating(true);

    try {
      const options: GPXGenerationOptions = {
        name: formData.name,
        description: formData.description,
        activityType: formData.activityType,
        coordinates: routeGeometry.coordinates,
        startTime: new Date(),
        elevationGain: formData.elevationGain > 0 ? formData.elevationGain : undefined,
        elevationProfile: formData.elevationProfile,
        addNoise: formData.addNoise,
        pauseDuration: formData.pauseDuration,
        useRealisticTiming: formData.useRealisticTiming,
        samplingRateSeconds: formData.samplingRateSeconds,
        speedVariation: formData.speedVariation,
        useRealElevation: formData.useRealElevation,
      };

      // Add speed or pace
      if (formData.inputType === 'speed') {
        options.averageSpeedKmh = formData.averageSpeedKmh;
      } else {
        options.averagePaceMinPerKm = formData.averagePaceMinPerKm;
      }

      await downloadGpx(options);

      toast.success('GPX file generated successfully!', {
        description: `${formData.name} has been downloaded with ${formData.useRealisticTiming ? 'realistic' : 'standard'} timing.`,
      });
    } catch (error) {
      console.error('Error generating GPX:', error);
      toast.error('Failed to generate GPX file', {
        description: 'Please check your route data and try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = routeGeometry?.coordinates && routeGeometry.coordinates.length >= 2;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏃 Unified GPX Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate realistic GPX files with human-like pacing patterns, elevation data, and customizable timing
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Route Info */}
        {canGenerate && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">📍 Current Route</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>Waypoints: {waypoints.length}</div>
              <div>Distance: {totalDistance.toFixed(2)} km</div>
              <div>Type: {routeGeometry?.isRouted ? 'Routed' : 'Straight line'}</div>
            </div>
          </div>
        )}

        {!canGenerate && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              ⚠️ Please create a route with at least 2 waypoints using the map above to generate a GPX file.
            </p>
          </div>
        )}

        {/* Basic Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Activity Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="activity-type">Activity Type</Label>
            <Select 
              value={formData.activityType} 
              onValueChange={(value: 'Run' | 'Bike' | 'Walk') => handleInputChange('activityType', value)}
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

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Activity description..."
            rows={2}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Speed/Pace Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Label>Input Type:</Label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="inputType"
                  value="speed"
                  checked={formData.inputType === 'speed'}
                  onChange={(e) => handleInputChange('inputType', e.target.value)}
                />
                <span>Speed (km/h)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="inputType"
                  value="pace"
                  checked={formData.inputType === 'pace'}
                  onChange={(e) => handleInputChange('inputType', e.target.value)}
                />
                <span>Pace (min/km)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {formData.inputType === 'speed' ? (
              <div>
                <Label htmlFor="speed">Average Speed (km/h)</Label>
                <Input
                  id="speed"
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={formData.averageSpeedKmh}
                  onChange={(e) => handleInputChange('averageSpeedKmh', parseFloat(e.target.value) || 12)}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="pace">Average Pace (min/km)</Label>
                <Input
                  id="pace"
                  type="number"
                  min="2"
                  max="20"
                  step="0.1"
                  value={formData.averagePaceMinPerKm}
                  onChange={(e) => handleInputChange('averagePaceMinPerKm', parseFloat(e.target.value) || 5)}
                />
              </div>
            )}
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                {formData.inputType === 'speed' 
                  ? `≈ ${formatPace(60 / formData.averageSpeedKmh)}`
                  : `≈ ${formData.averageSpeedKmh.toFixed(1)} km/h`
                }
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">⚙️ Advanced Settings</h4>
          
          {/* Realistic Timing */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="realistic-timing"
              checked={formData.useRealisticTiming}
              onChange={(e) => handleInputChange('useRealisticTiming', e.target.checked)}
              className="h-4 w-4 rounded border border-input"
            />
            <Label htmlFor="realistic-timing">Use Realistic Human-like Pacing Patterns</Label>
          </div>

          {formData.useRealisticTiming && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div>
                <Label htmlFor="speed-variation">Speed Variation (0.05-0.5)</Label>
                <Input
                  id="speed-variation"
                  type="number"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={formData.speedVariation}
                  onChange={(e) => handleInputChange('speedVariation', parseFloat(e.target.value) || 0.15)}
                />
              </div>
              <div>
                <Label htmlFor="sampling-rate">GPS Sampling Rate (seconds)</Label>
                <Input
                  id="sampling-rate"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.samplingRateSeconds}
                  onChange={(e) => handleInputChange('samplingRateSeconds', parseInt(e.target.value) || 4)}
                />
              </div>
            </div>
          )}

          {/* Elevation Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="elevation-gain">Elevation Gain (meters)</Label>
                <Input
                  id="elevation-gain"
                  type="number"
                  min="0"
                  max="2000"
                  value={formData.elevationGain}
                  onChange={(e) => handleInputChange('elevationGain', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="elevation-profile">Elevation Profile</Label>
                <Select
                  value={formData.elevationProfile}
                  onValueChange={(value: 'flat' | 'hilly' | 'mountainous') => handleInputChange('elevationProfile', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">🏞️ Flat</SelectItem>
                    <SelectItem value="hilly">🏔️ Hilly</SelectItem>
                    <SelectItem value="mountainous">⛰️ Mountainous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Real Elevation Option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="real-elevation"
                checked={formData.useRealElevation}
                onChange={(e) => handleInputChange('useRealElevation', e.target.checked)}
                className="h-4 w-4 rounded border border-input"
              />
              <Label htmlFor="real-elevation">Use Real Elevation Data (Open-Elevation API)</Label>
            </div>

            {formData.useRealElevation && (
              <div className="ml-6 text-sm text-muted-foreground">
                <p>⚠️ This will fetch real elevation data from Open-Elevation API</p>
                <p>• May take a few seconds for longer routes</p>
                <p>• Falls back to simulated elevation if API fails</p>
              </div>
            )}
          </div>

          {/* Other Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add-noise"
                checked={formData.addNoise}
                onChange={(e) => handleInputChange('addNoise', e.target.checked)}
                className="h-4 w-4 rounded border border-input"
              />
              <Label htmlFor="add-noise">Add Speed Variations</Label>
            </div>
            <div>
              <Label htmlFor="pause-duration">Pause Duration (seconds)</Label>
              <Input
                id="pause-duration"
                type="number"
                min="0"
                max="300"
                value={formData.pauseDuration}
                onChange={(e) => handleInputChange('pauseDuration', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Preview Data */}
        {previewData && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">📊 Preview Stats</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>Distance: {previewData.distance} km</div>
              <div>Duration: {previewData.duration}</div>
              <div>Avg Speed: {previewData.speed} km/h</div>
              <div>Avg Pace: {previewData.pace}</div>
              <div>Points: {previewData.points}</div>
              <div>Elevation: {previewData.elevationGain}m gain</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {previewData.realisticTiming ? '✅ Using realistic human-like pacing patterns' : '⚡ Using standard timing'}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={generatePreview} 
            disabled={!canGenerate}
            variant="outline"
            className="flex-1"
          >
            🔍 Preview Stats
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="flex-1"
          >
            {isGenerating ? 'Generating...' : '📥 Generate & Download GPX'}
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p>• <strong>Realistic Timing:</strong> Includes warmup, peak performance, and fatigue patterns</p>
          <p>• <strong>Speed Variation:</strong> Gaussian distribution for natural human movement</p>
          <p>• <strong>GPS Sampling:</strong> Realistic sampling rate and elevation changes</p>
          <p>• <strong>Real Elevation:</strong> Fetches actual elevation data from Open-Elevation API</p>
          <p>• <strong>Fallback System:</strong> Graceful degradation to simulated elevation if API fails</p>
        </div>
      </CardContent>
    </Card>
  );
}
