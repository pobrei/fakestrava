'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GPXRoute } from '@/types';
import { downloadGPX, estimateActivityDuration } from '@/lib/gpx';
import { useRoutes } from '@/hooks/useRoutes';
import { toast } from 'sonner';

interface RouteListProps {
  routes: GPXRoute[];
}

export default function RouteList({ routes }: RouteListProps) {
  const { deleteRoute } = useRoutes();

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(2)}km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDownload = (route: GPXRoute) => {
    try {
      downloadGPX(route);
      toast.success('GPX file generated successfully!', {
        description: `${route.name} has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating GPX:', error);
      toast.error('Failed to generate GPX file', {
        description: 'Please try again.',
      });
    }
  };

  const handleDelete = (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      deleteRoute(routeId);
      toast.success('Route deleted successfully');
    }
  };

  if (routes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 text-center">
            No routes created yet. Create your first route above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Saved Routes</h2>
      {routes.map((route) => {
        const estimatedDuration = estimateActivityDuration(route.distance, route.activityType);
        
        return (
          <Card key={route.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{route.name}</CardTitle>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span className="capitalize">{route.activityType}</span>
                    <span>{formatDistance(route.distance)}</span>
                    <span>{formatDuration(estimatedDuration)}</span>
                    <span>{route.points.length} points</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleDownload(route)}
                  >
                    Generate GPX
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(route.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            {route.description && (
              <CardContent>
                <p className="text-gray-600">{route.description}</p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
