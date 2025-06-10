# 🌍 Elevation API Integration for Realistic GPX Data

This document explains the elevation API integration implemented for generating realistic GPX files with real-world elevation data.

## 📡 **Open-Elevation API Integration**

### **Implementation Overview**

The system uses the **Open-Elevation API** to fetch real elevation data for GPS coordinates through a **server-side proxy** to avoid CORS issues:

```typescript
async function addElevationToPoints(points: Point[]): Promise<PointWithElevation[]>
```

### **CORS Solution**

We've implemented a **Next.js API route** (`/api/elevation`) that acts as a proxy to the Open-Elevation API:
- **Client-side**: Makes requests to `/api/elevation` (same origin, no CORS)
- **Server-side**: Proxies requests to `https://api.open-elevation.com/api/v1/lookup`
- **Fallback**: Automatically provides simulated elevation if the external API fails

### **Key Features**

✅ **Batch Processing**: Handles up to 100 points per request (API limit: 1024)  
✅ **Error Handling**: Comprehensive retry logic with exponential backoff  
✅ **Rate Limiting**: Respects API rate limits with intelligent delays  
✅ **Fallback System**: Graceful degradation to simulated elevation  
✅ **Timeout Protection**: 30-second request timeout to prevent hanging  
✅ **Data Validation**: Validates API response structure and point count  

### **API Request Format**

```typescript
// POST https://api.open-elevation.com/api/v1/lookup
{
  "locations": [
    { "latitude": 40.7829, "longitude": -73.9857 },
    { "latitude": 40.7849, "longitude": -73.9857 }
  ]
}
```

### **API Response Format**

```typescript
{
  "results": [
    { "latitude": 40.7829, "longitude": -73.9857, "elevation": 127.3 },
    { "latitude": 40.7849, "longitude": -73.9857, "elevation": 132.1 }
  ]
}
```

### **Error Handling Strategy**

1. **Retry Logic**: Up to 2 retries with increasing delays (1s, 2s)
2. **Rate Limit Handling**: 5-second delay for 429 responses
3. **Timeout Protection**: 30-second request timeout
4. **Fallback Elevation**: Geographic-based simulation when API fails

### **Usage Example**

```typescript
// Enable real elevation in GPX generation
const options = {
  name: 'Mountain Trail Run',
  avgSpeedKmh: 10,
  startTime: new Date(),
  addElevation: true,
  useRealElevation: true, // 🔥 Enable real elevation API
  activityType: 'Run'
};

const gpxContent = await generateRealisticGPX(points, options);
```

## 🗺️ **Alternative: Mapbox Terrain RGB Tiles**

For **offline use** or **higher performance**, you can replace the Open-Elevation API with Mapbox Terrain RGB tiles.

### **Why Mapbox Terrain RGB?**

- **Offline Capability**: Download tiles for offline use
- **Higher Performance**: No network requests during generation
- **Better Coverage**: Global coverage with consistent quality
- **Cost Control**: Predictable pricing based on tile requests

### **Implementation Approach**

```typescript
// 1. Calculate tile coordinates from lat/lng
function getTileCoordinates(lat: number, lng: number, zoom: number = 14) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x, y, z: zoom };
}

// 2. Fetch Mapbox Terrain RGB tile
async function fetchTerrainTile(x: number, y: number, z: number): Promise<ImageData> {
  const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}.pngraw?access_token=${MAPBOX_TOKEN}`;
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  
  // Convert to ImageData using Canvas API or image processing library
  return decodeImageData(arrayBuffer);
}

// 3. Extract elevation from RGB pixel values
function rgbToElevation(r: number, g: number, b: number): number {
  // Mapbox Terrain RGB encoding formula
  return -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
}
```

### **RGB to Elevation Decoding**

Mapbox Terrain RGB tiles encode elevation in RGB values:

```typescript
function decodeElevation(r: number, g: number, b: number): number {
  // Mapbox formula: elevation = -10000 + ((R * 256² + G * 256 + B) * 0.1)
  const elevation = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
  return Math.round(elevation); // Round to nearest meter
}
```

### **Pixel Coordinate Calculation**

```typescript
function getPixelCoordinates(lat: number, lng: number, tileX: number, tileY: number, zoom: number) {
  const tileSize = 256;
  const n = Math.pow(2, zoom);
  
  // Calculate pixel position within tile
  const pixelX = Math.floor(((lng + 180) / 360 * n - tileX) * tileSize);
  const pixelY = Math.floor(((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n - tileY) * tileSize);
  
  return { x: pixelX, y: pixelY };
}
```

### **Complete Offline Implementation**

```typescript
async function addElevationFromMapbox(points: Point[]): Promise<PointWithElevation[]> {
  const enrichedPoints: PointWithElevation[] = [];
  const tileCache = new Map<string, ImageData>();
  
  for (const point of points) {
    const { x: tileX, y: tileY, z: zoom } = getTileCoordinates(point.lat, point.lng);
    const tileKey = `${tileX}-${tileY}-${zoom}`;
    
    // Get tile from cache or fetch
    let tileData = tileCache.get(tileKey);
    if (!tileData) {
      tileData = await fetchTerrainTile(tileX, tileY, zoom);
      tileCache.set(tileKey, tileData);
    }
    
    // Get pixel coordinates within tile
    const { x: pixelX, y: pixelY } = getPixelCoordinates(point.lat, point.lng, tileX, tileY, zoom);
    
    // Extract RGB values from pixel
    const pixelIndex = (pixelY * 256 + pixelX) * 4; // RGBA format
    const r = tileData.data[pixelIndex];
    const g = tileData.data[pixelIndex + 1];
    const b = tileData.data[pixelIndex + 2];
    
    // Decode elevation
    const elevation = rgbToElevation(r, g, b);
    
    enrichedPoints.push({
      ...point,
      ele: elevation
    });
  }
  
  return enrichedPoints;
}
```

## 🔄 **Migration Strategy**

To switch from Open-Elevation to Mapbox:

1. **Replace the API call** in `addElevationToPoints()`
2. **Add Mapbox token** to environment variables
3. **Implement tile caching** for performance
4. **Add offline tile storage** for complete offline support

## 📊 **Performance Comparison**

| Method | Speed | Offline | Cost | Accuracy |
|--------|-------|---------|------|----------|
| Open-Elevation | Slow | ❌ | Free | Good |
| Mapbox RGB | Fast | ✅ | Paid | Excellent |
| Simulated | Fastest | ✅ | Free | Fair |

## 🎯 **Recommendations**

- **Development/Testing**: Use Open-Elevation API (free, simple)
- **Production/High-Volume**: Use Mapbox RGB tiles (fast, reliable)
- **Offline Apps**: Pre-download Mapbox tiles for target regions
- **Fallback**: Always include simulated elevation as backup

The current implementation provides a solid foundation that can be easily extended with Mapbox integration when needed.
