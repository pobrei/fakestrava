'use client';

import dynamic from 'next/dynamic';

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
      <InteractiveMap
        center={[40.7128, -74.0060]}
        zoom={13}
        height="500px"
        className="w-full"
      />
    </div>
  );
}
