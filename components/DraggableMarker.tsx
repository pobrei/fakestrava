'use client';

import { useRef, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useWaypointStore, Waypoint } from '@/lib/store';

interface DraggableMarkerProps {
  waypoint: Waypoint;
}

export default function DraggableMarker({ waypoint }: DraggableMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const { updateWaypoint, deleteWaypoint, waypoints } = useWaypointStore();

  // Create custom icon based on waypoint order
  const customIcon = useMemo(() => {
    const isFirst = waypoint.order === 0;
    const isLast = waypoint.order === waypoints.length - 1;
    
    let iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    
    if (isFirst) {
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
    } else if (isLast && waypoints.length > 1) {
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
    } else {
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
    }

    return L.icon({
      iconUrl,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }, [waypoint.order, waypoints.length]);

  const eventHandlers = useMemo(
    () => ({
      async dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          await updateWaypoint(waypoint.id, lat, lng);
        }
      },
    }),
    [waypoint.id, updateWaypoint]
  );

  const handleDelete = async () => {
    await deleteWaypoint(waypoint.id);
  };

  const getWaypointLabel = () => {
    if (waypoint.order === 0) return 'Start';
    if (waypoint.order === waypoints.length - 1 && waypoints.length > 1) return 'End';
    return `Waypoint ${waypoint.order + 1}`;
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[waypoint.lat, waypoint.lng]}
      ref={markerRef}
      icon={customIcon}
    >
      <Popup>
        <div className="text-center">
          <div className="font-semibold mb-2">{getWaypointLabel()}</div>
          <div className="text-sm text-gray-600 mb-2">
            Lat: {waypoint.lat.toFixed(6)}<br />
            Lng: {waypoint.lng.toFixed(6)}
          </div>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Delete
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
