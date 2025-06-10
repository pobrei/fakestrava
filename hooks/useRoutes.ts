'use client';

import { useState, useCallback } from 'react';
import { GPXRoute, GPXPoint } from '@/types';

export function useRoutes() {
  const [routes, setRoutes] = useState<GPXRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addRoute = useCallback((route: Omit<GPXRoute, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRoute: GPXRoute = {
      ...route,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setRoutes(prev => [...prev, newRoute]);
    return newRoute;
  }, []);

  const updateRoute = useCallback((id: string, updates: Partial<GPXRoute>) => {
    setRoutes(prev => 
      prev.map(route => 
        route.id === id 
          ? { ...route, ...updates, updatedAt: new Date() }
          : route
      )
    );
  }, []);

  const deleteRoute = useCallback((id: string) => {
    setRoutes(prev => prev.filter(route => route.id !== id));
  }, []);

  const calculateDistance = useCallback((points: GPXPoint[]): number => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Haversine formula for distance calculation
      const R = 6371000; // Earth's radius in meters
      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
      const dLng = (curr.lng - prev.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    
    return totalDistance;
  }, []);

  return {
    routes,
    isLoading,
    addRoute,
    updateRoute,
    deleteRoute,
    calculateDistance,
  };
}
