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
import { MapPin, Route, Download, Settings, Zap, Mountain } from 'lucide-react';

interface RouteSettings {
  name: string;
  description: string;
  activityType: 'Run' | 'Bike' | 'Walk';
  inputType: 'speed' | 'pace';
  averageSpeedKmh: number;
  averagePaceMinPerKm: number;
  elevationMode: 'auto' | 'manual' | 'none';
  manualElevationGain: number;
  elevationProfile: 'flat' | 'hilly' | 'mountainous';
  useRealisticTiming: boolean;
  speedVariation: number;
  samplingRateSeconds: number;
}

export default function UnifiedRoutePanel() {
  const { waypoints, routeGeometry, totalDistance, clearWaypoints, addWaypoint } = useWaypointStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const [settings, setSettings] = useState<RouteSettings>({
    name: 'My Route',
    description: 'Generated with realistic GPS data',
    activityType: 'Run',
    inputType: 'speed',
    averageSpeedKmh: 12,
    averagePaceMinPerKm: 5,
    elevationMode: 'auto',
    manualElevationGain: 100,
    elevationProfile: 'hilly',
    useRealisticTiming: true,
    speedVariation: 0.15,
    samplingRateSeconds: 4
  });

  const handleSettingChange = (field: keyof RouteSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [field]: value };
      
      // Auto-convert between speed and pace
      if (field === 'inputType') {
        if (value === 'pace' && prev.averageSpeedKmh) {
          newSettings.averagePaceMinPerKm = Math.round((60 / prev.averageSpeedKmh) * 10) / 10;
        } else if (value === 'speed' && prev.averagePaceMinPerKm) {
          newSettings.averageSpeedKmh = Math.round((60 / prev.averagePaceMinPerKm) * 10) / 10;
        }
      } else if (field === 'averageSpeedKmh' && prev.inputType === 'speed') {
        newSettings.averagePaceMinPerKm = Math.round((60 / (value as number)) * 10) / 10;
      } else if (field === 'averagePaceMinPerKm' && prev.inputType === 'pace') {
        newSettings.averageSpeedKmh = Math.round((60 / (value as number)) * 10) / 10;
      }
      
      return newSettings;
    });
  };

  const generatePreview = () => {
    if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
      toast.error('Please create a route with at least 2 waypoints first.');
      return;
    }

    const distance = totalDistance;
    const speed = settings.inputType === 'speed' ? settings.averageSpeedKmh : 60 / settings.averagePaceMinPerKm;
    const duration = (distance / speed) * 3600; // seconds
    const points = routeGeometry.coordinates.length;

    setPreviewData({
      distance: distance.toFixed(2),
      duration: formatDuration(duration),
      pace: formatPace(60 / speed),
      speed: speed.toFixed(1),
      points,
      elevationMode: settings.elevationMode,
      elevationGain: settings.elevationMode === 'manual' ? settings.manualElevationGain : 'Auto-calculated',
      realisticTiming: settings.useRealisticTiming
    });

    toast.success('Preview generated!', {
      description: `${points} points, ${distance.toFixed(1)}km route`
    });
  };

  const handleGenerateGPX = async () => {
    if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
      toast.error('Please create a route with at least 2 waypoints first.');
      return;
    }

    setIsGenerating(true);

    try {
      const options: GPXGenerationOptions = {
        name: settings.name,
        description: settings.description,
        activityType: settings.activityType,
        coordinates: routeGeometry.coordinates,
        startTime: new Date(),
        useRealisticTiming: settings.useRealisticTiming,
        samplingRateSeconds: settings.samplingRateSeconds,
        speedVariation: settings.speedVariation,
      };

      // Handle elevation settings
      if (settings.elevationMode === 'auto') {
        options.addElevation = true;
        options.useRealElevation = true;
        options.elevationProfile = settings.elevationProfile;
      } else if (settings.elevationMode === 'manual') {
        options.addElevation = true;
        options.useRealElevation = false;
        options.elevationGain = settings.manualElevationGain;
        options.elevationProfile = settings.elevationProfile;
      }
      // elevationMode === 'none' means no elevation data

      // Add speed or pace
      if (settings.inputType === 'speed') {
        options.averageSpeedKmh = settings.averageSpeedKmh;
      } else {
        options.averagePaceMinPerKm = settings.averagePaceMinPerKm;
      }

      await downloadGpx(options);

      toast.success('GPX file generated successfully!', {
        description: `${settings.name} downloaded with ${settings.elevationMode} elevation data.`,
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Route Builder & GPX Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create routes on the map and generate realistic GPX files with automatic elevation data
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Route Status */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Current Route
            </h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearWaypoints}
              disabled={waypoints.length === 0}
            >
              Clear Route
            </Button>
          </div>
          
          {canGenerate ? (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>Waypoints: {waypoints.length}</div>
              <div>Distance: {totalDistance.toFixed(2)} km</div>
              <div>Type: {routeGeometry?.isRouted ? 'Routed' : 'Direct'}</div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click on the map above to add waypoints and create your route
            </p>
          )}
        </div>

        {/* Basic Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">📝 Activity Details</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Activity Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleSettingChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select 
                value={settings.activityType} 
                onValueChange={(value: 'Run' | 'Bike' | 'Walk') => handleSettingChange('activityType', value)}
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

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={settings.description}
              onChange={(e) => handleSettingChange('description', e.target.value)}
              placeholder="Activity description..."
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {/* Speed/Pace Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">⚡ Speed & Pace</h4>
          
          <div className="flex items-center space-x-4">
            <Label>Input Type:</Label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="inputType"
                  value="speed"
                  checked={settings.inputType === 'speed'}
                  onChange={(e) => handleSettingChange('inputType', e.target.value)}
                />
                <span>Speed (km/h)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="inputType"
                  value="pace"
                  checked={settings.inputType === 'pace'}
                  onChange={(e) => handleSettingChange('inputType', e.target.value)}
                />
                <span>Pace (min/km)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {settings.inputType === 'speed' ? (
              <div>
                <Label htmlFor="speed">Average Speed (km/h)</Label>
                <Input
                  id="speed"
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={settings.averageSpeedKmh}
                  onChange={(e) => handleSettingChange('averageSpeedKmh', parseFloat(e.target.value) || 12)}
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
                  value={settings.averagePaceMinPerKm}
                  onChange={(e) => handleSettingChange('averagePaceMinPerKm', parseFloat(e.target.value) || 5)}
                />
              </div>
            )}
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                {settings.inputType === 'speed' 
                  ? `≈ ${formatPace(60 / settings.averageSpeedKmh)}`
                  : `≈ ${settings.averageSpeedKmh.toFixed(1)} km/h`
                }
              </div>
            </div>
          </div>
        </div>

        {/* Elevation Settings */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Mountain className="h-4 w-4" />
            Elevation Data
          </h4>
          
          <div>
            <Label htmlFor="elevation-mode">Elevation Mode</Label>
            <Select 
              value={settings.elevationMode} 
              onValueChange={(value: 'auto' | 'manual' | 'none') => handleSettingChange('elevationMode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">🌍 Auto (Real elevation from API)</SelectItem>
                <SelectItem value="manual">⚙️ Manual (Custom elevation)</SelectItem>
                <SelectItem value="none">🏞️ None (Flat route)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.elevationMode !== 'none' && (
            <div className="grid grid-cols-2 gap-4">
              {settings.elevationMode === 'manual' && (
                <div>
                  <Label htmlFor="elevation-gain">Elevation Gain (meters)</Label>
                  <Input
                    id="elevation-gain"
                    type="number"
                    min="0"
                    max="2000"
                    value={settings.manualElevationGain}
                    onChange={(e) => handleSettingChange('manualElevationGain', parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="elevation-profile">Terrain Profile</Label>
                <Select 
                  value={settings.elevationProfile} 
                  onValueChange={(value: 'flat' | 'hilly' | 'mountainous') => handleSettingChange('elevationProfile', value)}
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
          )}

          {settings.elevationMode === 'auto' && (
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <p>🌍 <strong>Automatic elevation:</strong> Fetches real elevation data from Open-Elevation API</p>
              <p>• More accurate and realistic elevation profiles</p>
              <p>• Uses server-side proxy to avoid CORS issues</p>
              <p>• Automatically falls back to simulated elevation if API fails</p>
              <p>• May take a few seconds for longer routes</p>
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced Settings
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 border-l-2 border-muted pl-4">
              {/* Realistic Timing */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="realistic-timing"
                  checked={settings.useRealisticTiming}
                  onChange={(e) => handleSettingChange('useRealisticTiming', e.target.checked)}
                  className="h-4 w-4 rounded border border-input"
                />
                <Label htmlFor="realistic-timing">Use Realistic Human-like Pacing Patterns</Label>
              </div>

              {settings.useRealisticTiming && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <Label htmlFor="speed-variation">Speed Variation (0.05-0.5)</Label>
                    <Input
                      id="speed-variation"
                      type="number"
                      min="0.05"
                      max="0.5"
                      step="0.05"
                      value={settings.speedVariation}
                      onChange={(e) => handleSettingChange('speedVariation', parseFloat(e.target.value) || 0.15)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sampling-rate">GPS Sampling Rate (seconds)</Label>
                    <Input
                      id="sampling-rate"
                      type="number"
                      min="1"
                      max="10"
                      value={settings.samplingRateSeconds}
                      onChange={(e) => handleSettingChange('samplingRateSeconds', parseInt(e.target.value) || 4)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Data */}
        {previewData && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Route Preview
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><strong>Distance:</strong> {previewData.distance} km</div>
              <div><strong>Duration:</strong> {previewData.duration}</div>
              <div><strong>Avg Speed:</strong> {previewData.speed} km/h</div>
              <div><strong>Avg Pace:</strong> {previewData.pace}</div>
              <div><strong>GPS Points:</strong> {previewData.points}</div>
              <div><strong>Elevation:</strong> {previewData.elevationGain}</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {previewData.realisticTiming ? '✅ Using realistic human-like pacing patterns' : '⚡ Using standard timing'} •
              Elevation: {previewData.elevationMode}
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
            <Zap className="h-4 w-4 mr-2" />
            Preview Route
          </Button>
          <Button
            onClick={handleGenerateGPX}
            disabled={!canGenerate || isGenerating}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate & Download GPX'}
          </Button>
        </div>

        {/* Instructions */}
        {!canGenerate && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">🗺️ How to create a route:</h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Click on the map above to add your first waypoint</li>
              <li>2. Continue clicking to add more waypoints along your desired route</li>
              <li>3. The route will automatically connect waypoints with realistic paths</li>
              <li>4. Configure your activity settings below</li>
              <li>5. Generate your GPX file with realistic timing and elevation data</li>
            </ol>
          </div>
        )}

        {/* Feature Info */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p>• <strong>Automatic Elevation:</strong> Fetches real elevation data from Open-Elevation API</p>
          <p>• <strong>Realistic Timing:</strong> Includes warmup, peak performance, and fatigue patterns</p>
          <p>• <strong>Speed Variation:</strong> Gaussian distribution for natural human movement</p>
          <p>• <strong>GPS Sampling:</strong> Realistic sampling rate and elevation changes</p>
          <p>• <strong>Fallback System:</strong> Graceful degradation if elevation API fails</p>
        </div>
      </CardContent>
    </Card>
  );
}
