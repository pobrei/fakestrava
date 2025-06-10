'use client';

import { useState, useEffect } from 'react';
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
import { MapPin, Route, Download, Zap, Mountain, Clock, TrendingUp, TrendingDown, Search } from 'lucide-react';

interface ActivitySettings {
  name: string;
  activityType: 'Run' | 'Bike' | 'Walk';
  inputType: 'speed' | 'pace';
  averageSpeedKmh: number;
  averagePaceMinPerKm: number;
  useRealisticElevation: boolean;
  useRealisticPacing: boolean;
  routingProfile: 'driving-car' | 'cycling-regular' | 'foot-walking';
}

export default function SmartRouteBuilder() {
  const { waypoints, routeGeometry, totalDistance, clearWaypoints, setRoutingProfile } = useWaypointStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [settings, setSettings] = useState<ActivitySettings>({
    name: 'My Route',
    activityType: 'Run',
    inputType: 'speed',
    averageSpeedKmh: 12,
    averagePaceMinPerKm: 5,
    useRealisticElevation: true,
    useRealisticPacing: true,
    routingProfile: 'foot-walking'
  });

  // Auto-generate activity name based on distance and type
  useEffect(() => {
    if (totalDistance > 0) {
      const distance = totalDistance.toFixed(1);
      const activityName = `${distance}km ${settings.activityType}`;
      if (settings.name === 'My Route' || settings.name.includes('km')) {
        setSettings(prev => ({ ...prev, name: activityName }));
      }
    }
  }, [totalDistance, settings.activityType]);

  // Update routing profile when it changes
  useEffect(() => {
    setRoutingProfile(settings.routingProfile);
  }, [settings.routingProfile, setRoutingProfile]);

  const handleSettingChange = (field: keyof ActivitySettings, value: any) => {
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
      
      // Auto-adjust speed recommendations and routing profile based on activity type
      if (field === 'activityType') {
        if (value === 'Run' && prev.averageSpeedKmh > 20) {
          newSettings.averageSpeedKmh = 12;
          newSettings.averagePaceMinPerKm = 5;
          newSettings.routingProfile = 'foot-walking';
        } else if (value === 'Bike' && prev.averageSpeedKmh < 15) {
          newSettings.averageSpeedKmh = 25;
          newSettings.averagePaceMinPerKm = 2.4;
          newSettings.routingProfile = 'cycling-regular';
        } else if (value === 'Walk' && prev.averageSpeedKmh > 8) {
          newSettings.averageSpeedKmh = 5;
          newSettings.averagePaceMinPerKm = 12;
          newSettings.routingProfile = 'foot-walking';
        }
      }


      
      return newSettings;
    });
  };

  const handleCitySearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a city name to search');
      return;
    }

    try {
      // Use Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();

      if (results.length === 0) {
        toast.error('City not found. Please try a different search term.');
        return;
      }

      const result = results[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      // Center map on the found location
      if (window.map) {
        window.map.setView([lat, lng], 13);
        toast.success(`Found ${result.display_name}`);
      }
    } catch (error) {
      console.error('City search error:', error);
      toast.error('Failed to search for city. Please try again.');
    }
  };

  const generatePreview = async () => {
    if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
      toast.error('Please create a route by clicking on the map above.');
      return;
    }

    const distance = totalDistance;
    const baseSpeed = settings.inputType === 'speed' ? settings.averageSpeedKmh : 60 / settings.averagePaceMinPerKm;
    
    // Estimate duration with elevation adjustments if realistic pacing is enabled
    let estimatedDuration = (distance / baseSpeed) * 3600; // base duration in seconds
    
    if (settings.useRealisticPacing && settings.useRealisticElevation) {
      // Add extra time for elevation gain (rough estimate: +30 seconds per 10m elevation gain for running)
      const elevationPenalty = settings.activityType === 'Run' ? 3 : 
                              settings.activityType === 'Bike' ? 1.5 : 5;
      const estimatedElevationGain = distance * 15; // Rough estimate: 15m gain per km
      estimatedDuration += estimatedElevationGain * elevationPenalty;
    }

    const points = routeGeometry.coordinates.length;

    setPreviewData({
      distance: distance.toFixed(2),
      duration: formatDuration(estimatedDuration),
      basePace: formatPace(60 / baseSpeed),
      baseSpeed: baseSpeed.toFixed(1),
      points,
      realisticFeatures: {
        elevation: settings.useRealisticElevation,
        pacing: settings.useRealisticPacing
      }
    });

    toast.success('Route preview ready!', {
      description: `${points} GPS points over ${distance.toFixed(1)}km`
    });
  };

  const handleGenerateGPX = async () => {
    if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
      toast.error('Please create a route by clicking on the map above.');
      return;
    }

    setIsGenerating(true);

    try {
      const options: GPXGenerationOptions = {
        name: settings.name,
        description: `${settings.activityType} activity with ${settings.useRealisticElevation ? 'real elevation data' : 'simulated elevation'} and ${settings.useRealisticPacing ? 'elevation-adjusted pacing' : 'constant pacing'}`,
        activityType: settings.activityType,
        coordinates: routeGeometry.coordinates,
        startTime: new Date(),
        
        // Always use realistic timing for human-like patterns
        useRealisticTiming: true,
        samplingRateSeconds: 4,
        speedVariation: 0.15,
        
        // Elevation settings
        addElevation: settings.useRealisticElevation,
        useRealElevation: settings.useRealisticElevation,
        elevationProfile: 'hilly', // Default to hilly for realistic variation
        
        // Enhanced pacing with elevation adjustments
        useElevationAdjustedPacing: settings.useRealisticPacing,
      };

      // Add speed or pace
      if (settings.inputType === 'speed') {
        options.averageSpeedKmh = settings.averageSpeedKmh;
      } else {
        options.averagePaceMinPerKm = settings.averagePaceMinPerKm;
      }

      await downloadGpx(options);

      toast.success('GPX file downloaded!', {
        description: `${settings.name} with ${settings.useRealisticElevation ? 'real' : 'simulated'} elevation data`,
      });
    } catch (error) {
      console.error('Error generating GPX:', error);
      toast.error('Failed to generate GPX file', {
        description: 'Please try again or check your internet connection.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = routeGeometry?.coordinates && routeGeometry.coordinates.length >= 2;
  const speedRecommendations = {
    Run: { min: 8, max: 20, optimal: 12 },
    Bike: { min: 15, max: 45, optimal: 25 },
    Walk: { min: 3, max: 8, optimal: 5 }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Smart Route Builder
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create realistic GPS tracks with real elevation data and intelligent speed adjustments for climbs and descents
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* City Search */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Location
          </h4>
          <div className="flex gap-2">
            <Input
              placeholder="Search for a city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCitySearch()}
              className="flex-1"
            />
            <Button onClick={handleCitySearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Route Status */}
        <div className={`p-4 rounded-lg border-2 ${canGenerate ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {canGenerate ? '✅ Route Ready' : '📍 Create Your Route'}
            </h4>
            {canGenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearWaypoints}
              >
                Clear Route
              </Button>
            )}
          </div>
          
          {canGenerate ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><strong>Waypoints:</strong> {waypoints.length}</div>
                <div><strong>Distance:</strong> {totalDistance.toFixed(2)} km</div>
                <div><strong>Route Type:</strong> {routeGeometry?.isRouted ? 'Smart Routed' : 'Direct Path'}</div>
              </div>

              {/* Routing Profile */}
              <div>
                <Label htmlFor="routing-profile">Routing Profile</Label>
                <Select
                  value={settings.routingProfile}
                  onValueChange={(value: 'driving-car' | 'cycling-regular' | 'foot-walking') => handleSettingChange('routingProfile', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foot-walking">🚶 Walking/Running</SelectItem>
                    <SelectItem value="cycling-regular">🚴 Cycling</SelectItem>
                    <SelectItem value="driving-car">🚗 Driving</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Changes how routes are calculated between waypoints
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <p className="mb-2">👆 <strong>Click on the map above to start building your route:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click to place your starting point</li>
                <li>Continue clicking to add waypoints along your desired path</li>
                <li>The route will automatically connect points with realistic roads/paths</li>
              </ol>
            </div>
          )}
        </div>

        {/* Activity Settings */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Activity Settings
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Activity Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleSettingChange('name', e.target.value)}
                placeholder="My awesome route"
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
        </div>

        {/* Speed/Pace Settings */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Speed & Pace
          </h4>
          
          <div className="flex items-center space-x-4">
            <Label>Input Method:</Label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  value="speed"
                  checked={settings.inputType === 'speed'}
                  onChange={(e) => handleSettingChange('inputType', e.target.value)}
                  className="h-4 w-4"
                />
                <span>Speed (km/h)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  value="pace"
                  checked={settings.inputType === 'pace'}
                  onChange={(e) => handleSettingChange('inputType', e.target.value)}
                  className="h-4 w-4"
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
                  min={speedRecommendations[settings.activityType].min}
                  max={speedRecommendations[settings.activityType].max}
                  step="0.5"
                  value={settings.averageSpeedKmh}
                  onChange={(e) => handleSettingChange('averageSpeedKmh', parseFloat(e.target.value) || speedRecommendations[settings.activityType].optimal)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: {speedRecommendations[settings.activityType].min}-{speedRecommendations[settings.activityType].max} km/h
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Equivalent: {settings.averageSpeedKmh.toFixed(1)} km/h
                </p>
              </div>
            )}
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <div><strong>Conversion:</strong></div>
                <div>{settings.inputType === 'speed' 
                  ? `${formatPace(60 / settings.averageSpeedKmh)} pace`
                  : `${settings.averageSpeedKmh.toFixed(1)} km/h speed`
                }</div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Features */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Mountain className="h-4 w-4" />
            Smart Features
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="realistic-elevation"
                    checked={settings.useRealisticElevation}
                    onChange={(e) => handleSettingChange('useRealisticElevation', e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <Label htmlFor="realistic-elevation" className="font-medium">Real Elevation Data</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {settings.useRealisticElevation ? '🌍 Using Open-Elevation API' : '🏞️ Using flat simulation'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="realistic-pacing"
                    checked={settings.useRealisticPacing}
                    onChange={(e) => handleSettingChange('useRealisticPacing', e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <Label htmlFor="realistic-pacing" className="font-medium">Elevation-Adjusted Pacing</Label>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  {settings.useRealisticPacing ? (
                    <>
                      <TrendingDown className="h-3 w-3" />
                      Slower uphill
                      <TrendingUp className="h-3 w-3" />
                      Faster downhill
                    </>
                  ) : (
                    '⚡ Constant speed'
                  )}
                </div>
              </div>
            </div>
          </div>

          {settings.useRealisticElevation && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <p><strong>Real Elevation:</strong> Fetches actual elevation data from Open-Elevation API</p>
              <p>• More accurate elevation profiles and realistic climbs/descents</p>
              <p>• Automatically falls back to simulated data if API is unavailable</p>
            </div>
          )}

          {settings.useRealisticPacing && (
            <div className="text-xs text-muted-foreground bg-green-50 p-3 rounded-lg">
              <p><strong>Smart Pacing:</strong> Adjusts speed based on elevation changes</p>
              <p>• Slower speeds on uphill sections (realistic effort)</p>
              <p>• Faster speeds on downhill sections (gravity assist)</p>
              <p>• Natural speed variations for human-like movement patterns</p>
            </div>
          )}
        </div>

        {/* Preview Data */}
        {previewData && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Route Preview
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Distance:</strong> {previewData.distance} km</div>
              <div><strong>Est. Duration:</strong> {previewData.duration}</div>
              <div><strong>Base Speed:</strong> {previewData.baseSpeed} km/h</div>
              <div><strong>Base Pace:</strong> {previewData.basePace}</div>
              <div><strong>GPS Points:</strong> {previewData.points}</div>
              <div><strong>Features:</strong>
                {previewData.realisticFeatures.elevation && previewData.realisticFeatures.pacing ? 'Full Realism' :
                 previewData.realisticFeatures.elevation ? 'Real Elevation' :
                 previewData.realisticFeatures.pacing ? 'Smart Pacing' : 'Basic'}
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {previewData.realisticFeatures.elevation && previewData.realisticFeatures.pacing &&
                '🎯 Using real elevation data with intelligent speed adjustments for climbs and descents'}
              {previewData.realisticFeatures.elevation && !previewData.realisticFeatures.pacing &&
                '🌍 Using real elevation data with constant pacing'}
              {!previewData.realisticFeatures.elevation && previewData.realisticFeatures.pacing &&
                '⚡ Using simulated elevation with smart pacing adjustments'}
              {!previewData.realisticFeatures.elevation && !previewData.realisticFeatures.pacing &&
                '📊 Using basic simulation with constant speed'}
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
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate GPX'}
          </Button>
        </div>

        {/* Feature Summary */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p>🎯 <strong>Smart Route Builder:</strong> All-in-one tool for realistic GPS track generation</p>
          <p>🌍 <strong>Real Elevation:</strong> Fetches actual elevation data from Open-Elevation API</p>
          <p>⛰️ <strong>Elevation-Adjusted Pacing:</strong> Realistic speed changes on climbs and descents</p>
          <p>🏃 <strong>Human-like Patterns:</strong> Natural speed variations and GPS sampling</p>
          <p>📱 <strong>Export Ready:</strong> Compatible with Strava, Garmin Connect, and all major fitness apps</p>
        </div>
      </CardContent>
    </Card>
  );
}
