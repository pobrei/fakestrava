'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWaypointStore } from '@/lib/store';
import { generateGpx, downloadGpx, GPXGenerationOptions, formatPace, formatDuration } from '@/lib/gpx';
import { toast } from 'sonner';

export default function GPXExportDialog() {
  const { waypoints, routeGeometry, totalDistance } = useWaypointStore();
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    name: 'My Route',
    description: '',
    activityType: 'Run' as 'Run' | 'Bike',
    speedType: 'speed' as 'speed' | 'pace',
    averageSpeedKmh: 10,
    averagePaceMinPerKm: 6,
    elevationGain: 0,
    elevationProfile: 'flat' as 'flat' | 'hilly' | 'mountainous',
    addNoise: true,
    pauseDuration: 0,
  });

  const handleExport = () => {
    if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
      toast.error('Please create a route with at least 2 waypoints first.');
      return;
    }

    try {
      const options: GPXGenerationOptions = {
        name: exportOptions.name || 'My Route',
        description: exportOptions.description,
        activityType: exportOptions.activityType,
        coordinates: routeGeometry.coordinates,
        startTime: new Date(),
        elevationGain: exportOptions.elevationGain > 0 ? exportOptions.elevationGain : undefined,
        elevationProfile: exportOptions.elevationProfile,
        addNoise: exportOptions.addNoise,
        pauseDuration: exportOptions.pauseDuration,
      };

      // Add speed or pace
      if (exportOptions.speedType === 'speed') {
        options.averageSpeedKmh = exportOptions.averageSpeedKmh;
      } else {
        options.averagePaceMinPerKm = exportOptions.averagePaceMinPerKm;
      }

      downloadGpx(options);

      // Show success toast
      toast.success('GPX file generated successfully!', {
        description: `${exportOptions.name || 'My Route'} has been downloaded.`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error generating GPX:', error);
      toast.error('Failed to generate GPX file', {
        description: 'Please try again or check your route data.',
      });
    }
  };

  const handlePreview = () => {
    if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
      toast.error('Please create a route with at least 2 waypoints first.');
      return;
    }

    const options: GPXGenerationOptions = {
      name: exportOptions.name || 'My Route',
      description: exportOptions.description,
      activityType: exportOptions.activityType,
      coordinates: routeGeometry.coordinates,
      startTime: new Date(),
      elevationGain: exportOptions.elevationGain > 0 ? exportOptions.elevationGain : undefined,
      elevationProfile: exportOptions.elevationProfile,
      addNoise: exportOptions.addNoise,
      pauseDuration: exportOptions.pauseDuration,
    };

    // Add speed or pace
    if (exportOptions.speedType === 'speed') {
      options.averageSpeedKmh = exportOptions.averageSpeedKmh;
    } else {
      options.averagePaceMinPerKm = exportOptions.averagePaceMinPerKm;
    }

    const gpxContent = generateGpx(options);
    
    // Open preview in new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>GPX Preview</title></head>
          <body>
            <h1>GPX Preview</h1>
            <pre style="background: #f5f5f5; padding: 20px; overflow: auto;">${gpxContent}</pre>
          </body>
        </html>
      `);
    }
  };

  // Calculate estimated duration
  const speed = exportOptions.speedType === 'speed' 
    ? exportOptions.averageSpeedKmh 
    : 60 / exportOptions.averagePaceMinPerKm;
  const estimatedDurationSeconds = (totalDistance / speed) * 3600;

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        disabled={!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2}
        className="w-full"
      >
        Export Enhanced GPX
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Export GPX with Timestamps & Elevation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="route-name" className="block text-sm font-medium mb-1">
              Route Name
            </label>
            <Input
              id="route-name"
              value={exportOptions.name}
              onChange={(e) => setExportOptions(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Route"
            />
          </div>
          <div>
            <label htmlFor="activity-type" className="block text-sm font-medium mb-1">
              Activity Type
            </label>
            <select
              id="activity-type"
              value={exportOptions.activityType}
              onChange={(e) => setExportOptions(prev => ({ ...prev, activityType: e.target.value as 'Run' | 'Bike' }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="Run">🏃 Running</option>
              <option value="Bike">🚴 Cycling</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description (Optional)
          </label>
          <Input
            id="description"
            value={exportOptions.description}
            onChange={(e) => setExportOptions(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Route description..."
          />
        </div>

        {/* Speed/Pace Settings */}
        <div className="space-y-3">
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="speedType"
                value="speed"
                checked={exportOptions.speedType === 'speed'}
                onChange={(e) => setExportOptions(prev => ({ ...prev, speedType: e.target.value as 'speed' | 'pace' }))}
                className="mr-2"
              />
              Average Speed (km/h)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="speedType"
                value="pace"
                checked={exportOptions.speedType === 'pace'}
                onChange={(e) => setExportOptions(prev => ({ ...prev, speedType: e.target.value as 'speed' | 'pace' }))}
                className="mr-2"
              />
              Average Pace (min/km)
            </label>
          </div>

          {exportOptions.speedType === 'speed' ? (
            <div>
              <Input
                type="number"
                value={exportOptions.averageSpeedKmh}
                onChange={(e) => setExportOptions(prev => ({ ...prev, averageSpeedKmh: parseFloat(e.target.value) || 10 }))}
                min="1"
                max="50"
                step="0.1"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pace: {formatPace(60 / exportOptions.averageSpeedKmh)}
              </p>
            </div>
          ) : (
            <div>
              <Input
                type="number"
                value={exportOptions.averagePaceMinPerKm}
                onChange={(e) => setExportOptions(prev => ({ ...prev, averagePaceMinPerKm: parseFloat(e.target.value) || 6 }))}
                min="3"
                max="15"
                step="0.1"
                placeholder="6"
              />
              <p className="text-xs text-gray-500 mt-1">
                Speed: {(60 / exportOptions.averagePaceMinPerKm).toFixed(1)} km/h
              </p>
            </div>
          )}
        </div>

        {/* Elevation Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="elevation-gain" className="block text-sm font-medium mb-1">
              Elevation Gain (m)
            </label>
            <Input
              id="elevation-gain"
              type="number"
              value={exportOptions.elevationGain}
              onChange={(e) => setExportOptions(prev => ({ ...prev, elevationGain: parseInt(e.target.value) || 0 }))}
              min="0"
              max="2000"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="elevation-profile" className="block text-sm font-medium mb-1">
              Terrain Profile
            </label>
            <select
              id="elevation-profile"
              value={exportOptions.elevationProfile}
              onChange={(e) => setExportOptions(prev => ({ ...prev, elevationProfile: e.target.value as 'flat' | 'hilly' | 'mountainous' }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="flat">🏞️ Flat</option>
              <option value="hilly">⛰️ Hilly</option>
              <option value="mountainous">🏔️ Mountainous</option>
            </select>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.addNoise}
              onChange={(e) => setExportOptions(prev => ({ ...prev, addNoise: e.target.checked }))}
              className="mr-2"
            />
            Add realistic speed variations
          </label>
          
          <div>
            <label htmlFor="pause-duration" className="block text-sm font-medium mb-1">
              Pause Duration (seconds)
            </label>
            <Input
              id="pause-duration"
              type="number"
              value={exportOptions.pauseDuration}
              onChange={(e) => setExportOptions(prev => ({ ...prev, pauseDuration: parseInt(e.target.value) || 0 }))}
              min="0"
              max="300"
              placeholder="0"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <h4 className="font-medium mb-2">Route Summary</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>Distance: {totalDistance.toFixed(2)} km</div>
            <div>Estimated Duration: {formatDuration(estimatedDurationSeconds)}</div>
            <div>Waypoints: {waypoints.length}</div>
            <div>Route Type: {routeGeometry?.isRouted ? 'Road-snapped' : 'Straight lines'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handlePreview} variant="outline" className="flex-1">
            Preview GPX
          </Button>
          <Button onClick={handleExport} className="flex-1">
            Download GPX
          </Button>
          <Button onClick={() => setIsOpen(false)} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
