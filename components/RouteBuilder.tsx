'use client';

import dynamic from 'next/dynamic';
import MapControls from './MapControls';

// Dynamically import the InteractiveMap to avoid SSR issues
const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg border flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

interface RouteBuilderProps {
  className?: string;
}

export default function RouteBuilder({ className = '' }: RouteBuilderProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map takes up 3/4 of the space on large screens */}
        <div className="lg:col-span-3">
          <InteractiveMap
            center={[40.7128, -74.0060]}
            zoom={13}
            height="500px"
            className="w-full"
          />
        </div>
        
        {/* Controls take up 1/4 of the space on large screens */}
        <div className="lg:col-span-1">
          <MapControls />
        </div>
      </div>
    </div>
  );
}
