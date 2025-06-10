'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWaypointStore, Waypoint } from '@/lib/store';
import DraggableMarker from './DraggableMarker';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ waypoints }: { waypoints: Waypoint[] }) {
  const map = useMap();

  useEffect(() => {
    // Expose map instance globally for city search
    (window as any).map = map;

    if (waypoints.length > 1) {
      const bounds = L.latLngBounds(
        waypoints.map(wp => [wp.lat, wp.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [waypoints, map]);

  return null;
}

interface InteractiveMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
}

export default function InteractiveMap({
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  height = '500px',
  className = '',
}: InteractiveMapProps) {
  const { waypoints, routeGeometry, addWaypoint, totalDistance, isRouting } = useWaypointStore();
  const mapRef = useRef<L.Map | null>(null);

  const handleMapClick = async (lat: number, lng: number) => {
    await addWaypoint(lat, lng);
  };

  // Create polyline coordinates - use routed geometry if available, otherwise straight lines
  const polylinePositions = routeGeometry?.coordinates
    ? routeGeometry.coordinates.map(coord => [coord[1], coord[0]] as [number, number]) // Convert [lng, lat] to [lat, lng]
    : waypoints
        .sort((a, b) => a.order - b.order)
        .map(wp => [wp.lat, wp.lng] as [number, number]);

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(2)}km`;
  };

  return (
    <div className={`relative ${className}`}>
      <div style={{ height }} className="w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler onMapClick={handleMapClick} />
          <FitBounds waypoints={waypoints} />
          
          {/* Render polyline connecting waypoints */}
          {polylinePositions.length > 1 && (
            <Polyline
              positions={polylinePositions}
              color={routeGeometry?.isRouted ? "#10b981" : "#3b82f6"} // Green for routed, blue for straight
              weight={4}
              opacity={0.8}
            />
          )}
          
          {/* Render draggable markers for each waypoint */}
          {waypoints.map((waypoint) => (
            <DraggableMarker
              key={waypoint.id}
              waypoint={waypoint}
            />
          ))}
        </MapContainer>
      </div>
      
      {/* Distance display */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Total Distance: </span>
            <span className="text-lg font-semibold text-blue-600">
              {formatDistance(totalDistance)}
            </span>
            {isRouting && (
              <span className="ml-2 text-xs text-orange-600">Calculating route...</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}
            {routeGeometry?.isRouted && (
              <span className="ml-2 text-green-600">• Routed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
