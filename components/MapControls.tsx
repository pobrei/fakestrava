'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWaypointStore } from '@/lib/store';
import { downloadGPX } from '@/lib/gpx';
import GPXExportDialog from './GPXExportDialog';
import { toast } from 'sonner';

export default function MapControls() {
  const {
    waypoints,
    routeGeometry,
    clearWaypoints,
    totalDistance,
    routingProfile,
    setRoutingProfile,
    isRouting
  } = useWaypointStore();

  const handleClearAll = () => {
    if (waypoints.length > 0 && confirm('Are you sure you want to clear all waypoints?')) {
      clearWaypoints();
    }
  };

  const handleExportGPX = () => {
    if (waypoints.length < 2) {
      toast.error('Please add at least 2 waypoints to export a route.');
      return;
    }

    try {
      // Convert waypoints to GPX route format
      const route = {
        id: crypto.randomUUID(),
        name: `Route ${new Date().toLocaleDateString()}`,
        description: 'Route created with Interactive Map',
        points: waypoints
          .sort((a, b) => a.order - b.order)
          .map(wp => ({
            lat: wp.lat,
            lng: wp.lng,
          })),
        distance: totalDistance * 1000, // Convert km to meters
        activityType: 'running' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      downloadGPX(route);

      // Show success toast
      toast.success('GPX file generated successfully!', {
        description: `Route with ${waypoints.length} waypoints has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating GPX:', error);
      toast.error('Failed to generate GPX file', {
        description: 'Please try again or check your route data.',
      });
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(2)}km`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Routing Profile Selection */}
        <div>
          <label htmlFor="routing-profile" className="block text-sm font-medium text-gray-700 mb-2">
            Routing Profile
          </label>
          <select
            id="routing-profile"
            value={routingProfile}
            onChange={(e) => setRoutingProfile(e.target.value as 'driving-car' | 'cycling-regular' | 'foot-walking')}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            disabled={isRouting}
          >
            <option value="driving-car">🚗 Driving</option>
            <option value="cycling-regular">🚴 Cycling</option>
            <option value="foot-walking">🚶 Walking</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Waypoints:</span>
            <div className="font-semibold">{waypoints.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Distance:</span>
            <div className="font-semibold text-blue-600">
              {formatDistance(totalDistance)}
              {isRouting && <span className="text-orange-600 ml-1">⏳</span>}
            </div>
          </div>
        </div>

        {/* Route Status */}
        {waypoints.length >= 2 && (
          <div className="text-xs text-gray-600">
            Route Type: {routeGeometry?.isRouted ? (
              <span className="text-green-600 font-medium">Road-snapped</span>
            ) : (
              <span className="text-blue-600 font-medium">Straight lines</span>
            )}
          </div>
        )}

        <div className="space-y-2">
          <GPXExportDialog />

          <Button
            onClick={handleExportGPX}
            disabled={waypoints.length < 2}
            variant="outline"
            className="w-full"
          >
            Quick Export (Legacy)
          </Button>

          <Button
            onClick={handleClearAll}
            variant="outline"
            disabled={waypoints.length === 0}
            className="w-full"
          >
            Clear All Waypoints
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Click on the map to add waypoints</p>
          <p>• Drag markers to reposition them</p>
          <p>• Click on markers to delete them</p>
          <p>• Green = Start, Red = End, Blue = Waypoint</p>
          <p>• Green lines = Road-snapped routes</p>
          <p>• Blue lines = Straight line routes</p>
        </div>
      </CardContent>
    </Card>
  );
}
