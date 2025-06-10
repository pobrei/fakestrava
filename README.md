# 🏃 FakeStrava - Smart Route Builder

A powerful web application for creating realistic GPS tracks with real elevation data and intelligent pacing patterns. Generate professional-quality GPX files that are indistinguishable from real fitness tracking data.

**🌟 Latest Update**: Complete Smart Route Builder with real elevation integration, city search, and elevation-adjusted pacing!

## ✨ Features

### 🗺️ **Smart Route Builder**
- **Interactive Map**: Click to create waypoints with visual feedback
- **City Search**: Search any city worldwide and center the map
- **Routing Profiles**: Choose between Walking/Running, Cycling, or Driving routes
- **Real-time Distance**: Live calculation with route optimization

### 🌍 **Real Elevation Data**
- **Open-Elevation API**: Fetches actual terrain elevation data
- **Server-side Proxy**: No CORS issues with robust error handling
- **Automatic Fallback**: Graceful degradation to simulated elevation
- **Batch Processing**: Efficient API usage with 100-point batches

### ⛰️ **Elevation-Adjusted Pacing**
- **Running**: 15% slower uphill, 8% faster downhill
- **Cycling**: 12% slower uphill, 15% faster downhill
- **Walking**: 10% slower uphill, 5% faster downhill
- **Grade Calculation**: Precise percentage-based speed adjustments

### 🎯 **Realistic GPX Generation**
- **Human-like Patterns**: Warmup, peak performance, and fatigue phases
- **Natural Variations**: Gaussian distribution for realistic GPS data
- **Activity-specific**: Different behaviors for Run/Bike/Walk
- **Professional Quality**: Ready for Strava, Garmin Connect, and all fitness apps

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Maps**: React Leaflet + Leaflet with OpenStreetMap
- **State Management**: Zustand
- **Geospatial**: Turf.js for distance calculations
- **Code Quality**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gpx-route-creator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```bash
# OpenRouteService API Key (for road snapping)
NEXT_PUBLIC_OPENROUTESERVICE_API_KEY=your_api_key_here
```

To get a free API key:
- Visit [OpenRouteService](https://openrouteservice.org/)
- Sign up for a free account
- Generate an API key
- Add it to your `.env.local` file

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3001](http://localhost:3001) in your browser.

## 🎯 How to Use

1. **🔍 Find Location**: Search for any city to start your route
2. **🗺️ Create Route**: Click on map to add waypoints
3. **⚙️ Choose Routing**: Select Walking/Cycling/Driving profile
4. **📝 Configure Activity**: Set name, type, and speed/pace
5. **🌍 Enable Real Features**: Toggle real elevation and smart pacing
6. **📊 Preview Route**: See distance, duration, and feature summary
7. **📥 Generate GPX**: Download realistic file ready for any fitness app

### Smart Features

- **Real Elevation**: Automatically fetches terrain data for your route
- **Elevation-Adjusted Pacing**: Realistic speed changes on climbs and descents
- **Activity-Specific**: Different pacing patterns for Run/Bike/Walk
- **Human-like Patterns**: Natural speed variations and GPS sampling

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── MapComponent.tsx  # Leaflet map wrapper
│   ├── RouteCreator.tsx  # Main route creation interface
│   └── RouteList.tsx     # Saved routes display
├── hooks/                # Custom React hooks
│   └── useRoutes.ts      # Route management logic
├── lib/                  # Utility functions
│   ├── utils.ts          # shadcn/ui utilities
│   └── gpx.ts            # GPX generation and export
├── types/                # TypeScript type definitions
│   └── index.ts          # App-specific types
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Features in Detail

### Route Creation
- Interactive map interface using Leaflet
- Click-to-add points with visual feedback
- Real-time distance calculation using Haversine formula
- Undo functionality for removing last point

### Route Management
- Save routes with custom names and descriptions
- View all saved routes with metadata
- Delete unwanted routes
- Persistent storage in browser

### GPX Export
- Generate valid GPX files with track points
- Include metadata like route name and activity type
- Estimated timestamps for realistic activity simulation
- One-click download functionality

### OpenRouteService Integration
- **Road Snapping**: Automatically snap waypoints to actual roads
- **Multiple Profiles**: Support for driving, cycling, and walking routes
- **Accurate Distances**: Real-world distance calculations using road networks
- **API Caching**: Intelligent caching to minimize API calls and improve performance
- **Fallback Support**: Gracefully falls back to straight lines if API is unavailable
- **Rate Limiting**: Built-in protection against API rate limits

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
