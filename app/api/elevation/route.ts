import { NextRequest, NextResponse } from 'next/server';

interface ElevationRequest {
  locations: Array<{ latitude: number; longitude: number }>;
}

interface ElevationResponse {
  results: Array<{
    latitude: number;
    longitude: number;
    elevation: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ElevationRequest = await request.json();
    
    // Validate request
    if (!body.locations || !Array.isArray(body.locations)) {
      return NextResponse.json(
        { error: 'Invalid request: locations array required' },
        { status: 400 }
      );
    }

    if (body.locations.length === 0) {
      return NextResponse.json({ results: [] });
    }

    if (body.locations.length > 100) {
      return NextResponse.json(
        { error: 'Too many locations: maximum 100 points per request' },
        { status: 400 }
      );
    }

    // Validate coordinates
    for (const location of body.locations) {
      if (
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number' ||
        location.latitude < -90 ||
        location.latitude > 90 ||
        location.longitude < -180 ||
        location.longitude > 180
      ) {
        return NextResponse.json(
          { error: 'Invalid coordinates in request' },
          { status: 400 }
        );
      }
    }

    // Call Open-Elevation API from server side (no CORS issues)
    const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.error(`Open-Elevation API error: ${response.status} ${response.statusText}`);
      
      // Return fallback elevation data
      const fallbackResults = body.locations.map(location => ({
        latitude: location.latitude,
        longitude: location.longitude,
        elevation: generateFallbackElevation(location.latitude, location.longitude)
      }));

      return NextResponse.json({
        results: fallbackResults,
        fallback: true,
        message: 'Using simulated elevation data due to API unavailability'
      });
    }

    const data: ElevationResponse = await response.json();

    // Validate response
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from elevation API');
    }

    if (data.results.length !== body.locations.length) {
      throw new Error(`Elevation API returned ${data.results.length} results for ${body.locations.length} points`);
    }

    // Return successful response
    return NextResponse.json({
      results: data.results.map(result => ({
        latitude: result.latitude,
        longitude: result.longitude,
        elevation: Math.round(result.elevation) // Round to nearest meter
      })),
      fallback: false
    });

  } catch (error) {
    console.error('Elevation API proxy error:', error);

    // Try to parse the original request for fallback
    try {
      const body: ElevationRequest = await request.json();
      const fallbackResults = body.locations.map(location => ({
        latitude: location.latitude,
        longitude: location.longitude,
        elevation: generateFallbackElevation(location.latitude, location.longitude)
      }));

      return NextResponse.json({
        results: fallbackResults,
        fallback: true,
        message: 'Using simulated elevation data due to API error'
      });
    } catch {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

/**
 * Generates realistic fallback elevation based on geographic patterns
 */
function generateFallbackElevation(lat: number, lng: number): number {
  // Base elevation
  const baseElevation = 100;
  
  // Geographic variation based on latitude (higher latitudes tend to be more mountainous)
  const latVariation = Math.abs(lat) * 2;
  
  // Longitude-based variation (simulate continental patterns)
  const lngVariation = Math.sin(lng * Math.PI / 180) * 50;
  
  // Add some randomness for terrain variation
  const randomVariation = (Math.random() - 0.5) * 100;
  
  // Ensure elevation doesn't go negative
  const elevation = Math.max(0, baseElevation + latVariation + lngVariation + randomVariation);
  
  return Math.round(elevation);
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
