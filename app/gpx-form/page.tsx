'use client';

import { useState } from 'react';
import GPXForm from '@/components/GPXForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GPXFormData } from '@/types';

// Sample route coordinates (Central Park loop in NYC)
const sampleCoordinates: [number, number][] = [
  [-73.9857, 40.7829], // Start
  [-73.9857, 40.7849], // North
  [-73.9737, 40.7849], // Northeast
  [-73.9737, 40.7829], // East
  [-73.9737, 40.7809], // Southeast
  [-73.9857, 40.7809], // South
  [-73.9857, 40.7829], // Back to start
];

const sampleDistance = 2.5; // km

export default function GPXFormPage() {
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [submittedData, setSubmittedData] = useState<GPXFormData | null>(null);

  const handleLoadSampleRoute = () => {
    setCoordinates(sampleCoordinates);
    setDistance(sampleDistance);
  };

  const handleClearRoute = () => {
    setCoordinates([]);
    setDistance(0);
    setSubmittedData(null);
  };

  const handleFormSubmit = (data: GPXFormData) => {
    setSubmittedData(data);
    console.log('Form submitted with data:', data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            GPX Form Demo
          </h1>
          <p className="text-gray-600 mt-1">
            Create GPX files with custom speed/pace settings using react-hook-form and zod validation
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={handleLoadSampleRoute} variant="outline">
                Load Sample Route (Central Park)
              </Button>
              <Button onClick={handleClearRoute} variant="outline">
                Clear Route
              </Button>
            </div>

            {coordinates.length > 0 && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><strong>Route loaded:</strong> {coordinates.length} coordinates, {distance} km</p>
                <p className="text-muted-foreground mt-1">
                  You can now use the form below to generate a GPX file with custom timing data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GPX Form */}
        <GPXForm
          coordinates={coordinates}
          distance={distance}
          onSubmit={handleFormSubmit}
        />

        {/* Form Submission Result */}
        {submittedData && (
          <Card>
            <CardHeader>
              <CardTitle>Form Submission Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Submitted Data:</h4>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Form Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">✅ Validation Features</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Zod schema validation</li>
                  <li>• Activity-specific speed/pace ranges</li>
                  <li>• Required field validation</li>
                  <li>• Real-time form validation</li>
                  <li>• TypeScript type safety</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">🎯 User Experience</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Speed ↔ Pace conversion</li>
                  <li>• Live duration preview</li>
                  <li>• Activity-specific defaults</li>
                  <li>• Accessible form controls</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">📊 Validation Ranges</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-muted p-3 rounded">
                  <strong>Running:</strong>
                  <br />Speed: 3-25 km/h
                  <br />Pace: 2.4-20 min/km
                </div>
                <div className="bg-muted p-3 rounded">
                  <strong>Cycling:</strong>
                  <br />Speed: 5-60 km/h
                  <br />Pace: 1-12 min/km
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Load Sample Route" to populate the form with sample coordinates</li>
              <li>Fill in the route name and optional description</li>
              <li>Select your activity type (Running or Cycling)</li>
              <li>Choose between speed (km/h) or pace (min/km) input</li>
              <li>Enter your average speed or pace</li>
              <li>Review the estimated duration in the preview</li>
              <li>Click "Generate & Download GPX" to create and download the file</li>
            </ol>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The form validates input ranges based on realistic values for each activity type.
                Speed and pace are automatically converted when you switch input types.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
