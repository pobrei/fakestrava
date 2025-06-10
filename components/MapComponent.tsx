'use client';

import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import { GPXPoint } from '@/types';

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  route?: GPXPoint[];
  className?: string;
}

function LeafletMap({
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  onMapClick,
  route = [],
  className = '',
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      // Import CSS dynamically
      if (typeof document !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix for default markers in Leaflet with Next.js
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      if (!mapContainerRef.current || mapRef.current) return;

      // Initialize map
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add click handler
      if (onMapClick) {
        mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom, onMapClick]);

  // Update route when route prop changes
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const updateRoute = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (!map) return;

      // Clear existing route and markers
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current = [];

      if (route.length === 0) return;

      // Add route polyline
      if (route.length > 1) {
        const latLngs = route.map(point => [point.lat, point.lng] as [number, number]);
        routeLayerRef.current = L.polyline(latLngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
        }).addTo(map);

        // Fit map to route bounds
        map.fitBounds(routeLayerRef.current.getBounds(), {
          padding: [20, 20],
        });
      }

      // Add markers for start and end points
      if (route.length > 0) {
        // Start marker (green)
        const startMarker = L.marker([route[0].lat, route[0].lng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(map);
        markersRef.current.push(startMarker);

        // End marker (red) - only if different from start
        if (route.length > 1) {
          const endPoint = route[route.length - 1];
          const endMarker = L.marker([endPoint.lat, endPoint.lng], {
            icon: L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          }).addTo(map);
          markersRef.current.push(endMarker);
        }
      }
    };

    updateRoute();
  }, [route]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full min-h-[400px] ${className}`}
    />
  );
}

// Export as dynamic component to prevent SSR issues
export default function MapComponent(props: MapComponentProps) {
  return <LeafletMap {...props} />;
}
