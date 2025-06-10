'use client';

import { useState } from 'react';
import { generateGPX, downloadGPX } from '@/lib/gpxGenerator';
import type { ActivityFormData } from './ActivityForm';
import type { LatLng } from 'leaflet';
import { toast } from 'sonner';

interface GPXDownloadButtonProps {
  route: LatLng[];
  activity: ActivityFormData;
  disabled?: boolean;
}

export default function GPXDownloadButton({ route, activity, disabled }: GPXDownloadButtonProps) {
  const handleDownload = () => {
    try {
      const gpxContent = generateGPX(
        route,
        activity.speed,
        activity.startTime,
        activity.type
      );

      downloadGPX(gpxContent, `fake-${activity.type.toLowerCase()}-${
        activity.startTime.toISOString().split('T')[0]
      }.gpx`);

      // Show success toast
      toast.success('GPX file generated successfully!', {
        description: `${activity.type} route with ${route.length} points has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating GPX:', error);
      toast.error('Failed to generate GPX file', {
        description: 'Please try again or check your route data.',
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || route.length < 2}
      className={`
        px-4 py-2 rounded-lg font-medium shadow
        ${disabled || route.length < 2
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
        }
      `}
    >
      Generate GPX
    </button>
  );
}
