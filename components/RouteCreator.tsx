'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapComponent from './MapComponent';
import RouteList from './RouteList';
import { GPXPoint } from '@/types';
import { useRoutes } from '@/hooks/useRoutes';

export default function RouteCreator() {
  const [isCreating, setIsCreating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<GPXPoint[]>([]);
  const [routeName, setRouteName] = useState('');
  const [activityType, setActivityType] = useState<'running' | 'cycling' | 'walking'>('running');
  const { routes, addRoute, calculateDistance } = useRoutes();

  const handleMapClick = (lat: number, lng: number) => {
    if (!isCreating) return;

    const newPoint: GPXPoint = { lat, lng };
    setCurrentRoute(prev => [...prev, newPoint]);
  };

  const startCreating = () => {
    setIsCreating(true);
    setCurrentRoute([]);
    setRouteName('');
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setCurrentRoute([]);
    setRouteName('');
  };

  const saveRoute = () => {
    if (currentRoute.length < 2 || !routeName.trim()) {
      alert('Please add at least 2 points and provide a route name');
      return;
    }

    const distance = calculateDistance(currentRoute);

    addRoute({
      name: routeName.trim(),
      points: currentRoute,
      distance,
      activityType,
    });

    setIsCreating(false);
    setCurrentRoute([]);
    setRouteName('');
    alert('Route saved successfully!');
  };

  const undoLastPoint = () => {
    setCurrentRoute(prev => prev.slice(0, -1));
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(2)}km`;
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Route</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isCreating ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="activity-type" className="block text-sm font-medium mb-2">Activity Type</label>
                <select
                  id="activity-type"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as 'running' | 'cycling' | 'walking')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
                  <option value="walking">Walking</option>
                </select>
              </div>
              <Button onClick={startCreating} className="w-full">
                Start Creating Route
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Route name"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={undoLastPoint}
                  disabled={currentRoute.length === 0}
                >
                  Undo Last Point
                </Button>
                <Button variant="outline" onClick={cancelCreating}>
                  Cancel
                </Button>
                <Button
                  onClick={saveRoute}
                  disabled={currentRoute.length < 2 || !routeName.trim()}
                >
                  Save Route
                </Button>
              </div>

              {currentRoute.length > 0 && (
                <div className="text-sm text-gray-600">
                  <p>Points: {currentRoute.length}</p>
                  {currentRoute.length > 1 && (
                    <p>Distance: {formatDistance(calculateDistance(currentRoute))}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <MapComponent
            onMapClick={handleMapClick}
            route={currentRoute}
            className="rounded-lg overflow-hidden"
          />
        </CardContent>
      </Card>

      {isCreating && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              Click on the map to add points to your route.
              {currentRoute.length === 0 && ' Start by clicking where you want to begin.'}
              {currentRoute.length === 1 && ' Add more points to create your route.'}
              {currentRoute.length > 1 && ' Continue adding points or save your route.'}
            </p>
          </CardContent>
        </Card>
      )}

      <RouteList routes={routes} />
    </div>
  );
}
