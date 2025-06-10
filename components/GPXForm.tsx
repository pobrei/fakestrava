'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateGpx, downloadGpx, GPXGenerationOptions, formatDuration } from '@/lib/gpx';
import { GPXFormData, GPXFormPreview } from '@/types';
import { toast } from 'sonner';

// Zod validation schema
const gpxFormSchema = z.object({
  name: z.string()
    .min(1, 'Route name is required')
    .max(100, 'Route name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  activityType: z.enum(['Run', 'Bike'], {
    required_error: 'Please select an activity type',
  }),
  inputType: z.enum(['speed', 'pace'], {
    required_error: 'Please select input type',
  }),
  averageSpeedKmh: z.number()
    .min(1, 'Speed must be at least 1 km/h')
    .max(100, 'Speed must be less than 100 km/h'),
  averagePaceMinPerKm: z.number()
    .min(1, 'Pace must be at least 1 min/km')
    .max(30, 'Pace must be less than 30 min/km'),
  coordinates: z.array(z.tuple([z.number(), z.number()]))
    .min(2, 'At least 2 coordinates are required'),
  distance: z.number()
    .min(0.1, 'Distance must be at least 0.1 km'),
}).refine((data) => {
  // Validate speed ranges based on activity type
  if (data.inputType === 'speed') {
    if (data.activityType === 'Run') {
      return data.averageSpeedKmh >= 3 && data.averageSpeedKmh <= 25;
    } else if (data.activityType === 'Bike') {
      return data.averageSpeedKmh >= 5 && data.averageSpeedKmh <= 60;
    }
  }
  return true;
}, {
  message: 'Speed is outside realistic range for selected activity',
  path: ['averageSpeedKmh'],
}).refine((data) => {
  // Validate pace ranges based on activity type
  if (data.inputType === 'pace') {
    if (data.activityType === 'Run') {
      return data.averagePaceMinPerKm >= 2.4 && data.averagePaceMinPerKm <= 20; // 3-25 km/h
    } else if (data.activityType === 'Bike') {
      return data.averagePaceMinPerKm >= 1 && data.averagePaceMinPerKm <= 12; // 5-60 km/h
    }
  }
  return true;
}, {
  message: 'Pace is outside realistic range for selected activity',
  path: ['averagePaceMinPerKm'],
});

type GPXFormValues = z.infer<typeof gpxFormSchema>;

interface GPXFormProps {
  coordinates?: [number, number][];
  distance?: number; // in km
  onSubmit?: (data: GPXFormData) => void;
  className?: string;
}

export default function GPXForm({
  coordinates = [],
  distance = 0,
  onSubmit,
  className
}: GPXFormProps) {
  const [preview, setPreview] = useState<GPXFormPreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GPXFormValues>({
    resolver: zodResolver(gpxFormSchema),
    defaultValues: {
      name: `Route ${new Date().toLocaleDateString()}`,
      description: '',
      activityType: 'Run',
      inputType: 'speed',
      averageSpeedKmh: 10,
      averagePaceMinPerKm: 6,
      coordinates,
      distance,
    },
  });

  const watchedValues = form.watch();

  // Update coordinates and distance when props change
  useEffect(() => {
    if (coordinates.length > 0) {
      form.setValue('coordinates', coordinates);
    }
    if (distance > 0) {
      form.setValue('distance', distance);
    }
  }, [coordinates, distance, form]);

  // Calculate preview when form values change
  useEffect(() => {
    const { activityType, inputType, averageSpeedKmh, averagePaceMinPerKm, distance } = watchedValues;
    
    if (distance > 0) {
      let speed: number;
      let pace: number;

      if (inputType === 'speed') {
        speed = averageSpeedKmh;
        pace = 60 / speed; // Convert speed to pace
      } else {
        pace = averagePaceMinPerKm;
        speed = 60 / pace; // Convert pace to speed
      }

      const estimatedDurationSeconds = (distance / speed) * 3600;
      const estimatedDurationFormatted = formatDuration(estimatedDurationSeconds);

      setPreview({
        estimatedDurationSeconds,
        estimatedDurationFormatted,
        averageSpeed: speed,
        averagePace: pace,
        distance,
      });
    } else {
      setPreview(null);
    }
  }, [watchedValues]);

  // Convert pace to speed and vice versa when input type changes
  const handleInputTypeChange = (newInputType: 'speed' | 'pace') => {
    const currentSpeed = form.getValues('averageSpeedKmh');
    const currentPace = form.getValues('averagePaceMinPerKm');

    if (newInputType === 'pace' && currentSpeed) {
      const newPace = 60 / currentSpeed;
      form.setValue('averagePaceMinPerKm', Math.round(newPace * 10) / 10, { shouldValidate: false });
    } else if (newInputType === 'speed' && currentPace) {
      const newSpeed = 60 / currentPace;
      form.setValue('averageSpeedKmh', Math.round(newSpeed * 10) / 10, { shouldValidate: false });
    }

    form.setValue('inputType', newInputType);
  };

  const handleSubmit = async (data: GPXFormValues) => {
    setIsSubmitting(true);

    try {
      const gpxOptions: GPXGenerationOptions = {
        name: data.name,
        description: data.description,
        activityType: data.activityType,
        coordinates: data.coordinates,
        startTime: new Date(),
      };

      // Add speed or pace based on input type
      if (data.inputType === 'speed') {
        gpxOptions.averageSpeedKmh = data.averageSpeedKmh;
      } else {
        gpxOptions.averagePaceMinPerKm = data.averagePaceMinPerKm;
      }

      // Generate and download GPX
      downloadGpx(gpxOptions);

      // Show success toast
      toast.success('GPX file generated successfully!', {
        description: `${data.name} has been downloaded with ${data.coordinates.length} points.`,
      });

      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(data);
      }

    } catch (error) {
      console.error('Error generating GPX:', error);
      toast.error('Failed to generate GPX file', {
        description: 'Please check your route data and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSpeedLabel = (activityType: 'Run' | 'Bike') => {
    return activityType === 'Run' ? 'Running Speed (km/h)' : 'Cycling Speed (km/h)';
  };

  const getPaceLabel = (activityType: 'Run' | 'Bike') => {
    return activityType === 'Run' ? 'Running Pace (min/km)' : 'Cycling Pace (min/km)';
  };

  const getSpeedRange = (activityType: 'Run' | 'Bike') => {
    return activityType === 'Run' ? '3-25 km/h' : '5-60 km/h';
  };

  const getPaceRange = (activityType: 'Run' | 'Bike') => {
    return activityType === 'Run' ? '2.4-20 min/km' : '1-12 min/km';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Generate GPX File</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Route Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter route name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter route description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Activity Type */}
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Run">🏃 Running</SelectItem>
                        <SelectItem value="Bike">🚴 Cycling</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Input Type Selection */}
            <FormField
              control={form.control}
              name="inputType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Input Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => handleInputTypeChange(value as 'speed' | 'pace')}
                      defaultValue={field.value}
                      value={field.value}
                      className="flex flex-row space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="speed" id="speed" />
                        <Label htmlFor="speed">Average Speed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pace" id="pace" />
                        <Label htmlFor="pace">Average Pace</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Speed/Pace Input */}
            {watchedValues.inputType === 'speed' ? (
              <FormField
                control={form.control}
                name="averageSpeedKmh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getSpeedLabel(watchedValues.activityType)}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        max="100"
                        placeholder="Enter speed"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Realistic range: {getSpeedRange(watchedValues.activityType)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="averagePaceMinPerKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getPaceLabel(watchedValues.activityType)}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        max="30"
                        placeholder="Enter pace"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Realistic range: {getPaceRange(watchedValues.activityType)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Preview */}
            {preview && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Distance: {preview.distance.toFixed(2)} km</div>
                  <div>Duration: {preview.estimatedDurationFormatted}</div>
                  <div>Speed: {preview.averageSpeed.toFixed(1)} km/h</div>
                  <div>Pace: {preview.averagePace.toFixed(1)} min/km</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || coordinates.length < 2 || distance <= 0}
            >
              {isSubmitting ? 'Generating...' : 'Generate & Download GPX'}
            </Button>

            {coordinates.length < 2 && (
              <p className="text-sm text-muted-foreground text-center">
                Please create a route with at least 2 points to generate GPX
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
