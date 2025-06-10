# GPX Route Creator

A modern web application for creating fake GPX routes for running, cycling, and walking activities. Built with Next.js 14, TypeScript, TailwindCSS, shadcn/ui, and Leaflet maps.

## Features

### Interactive Route Builder (New!)
- 🗺️ **React Leaflet Integration**: Modern map component with full TypeScript support
- 📍 **Click-to-Add Waypoints**: Simply click on the map to add waypoints
- 🎯 **Drag & Drop**: Drag markers to reposition waypoints in real-time
- 🗑️ **Delete Waypoints**: Click on markers to delete individual waypoints
- 🛣️ **Road Snapping**: Auto-snap routes to roads using OpenRouteService API
- 🚗🚴🚶 **Multiple Profiles**: Support for driving, cycling, and walking routes
- 📏 **Accurate Distance**: Real distance calculation using actual road networks
- 🎨 **Smart Markers**: Color-coded markers (Green=Start, Red=End, Blue=Waypoint)
- 🎨 **Route Visualization**: Green lines for road-snapped routes, blue for straight lines
- 📊 **Live Statistics**: Real-time waypoint count and total distance display
- 🔄 **State Management**: Powered by Zustand for efficient state handling
- ⚡ **API Caching**: Intelligent caching to minimize API calls
- 📥 **GPX Export**: Export your interactive routes as GPX files

### Classic Route Creator
- 🏃 Create routes for running, cycling, and walking
- 📍 Click-to-add route points
- 📏 Real-time distance calculation
- ⏱️ Estimated activity duration
- 📁 Save and manage multiple routes
- 📥 Export routes as GPX files
- 🎨 Modern UI with shadcn/ui components
- 📱 Responsive design

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

## Usage

### Interactive Route Builder

1. **Add Waypoints**: Click anywhere on the map to add waypoints
2. **Reposition**: Drag any marker to reposition waypoints
3. **Delete**: Click on a marker and use the delete button in the popup
4. **View Distance**: Real-time distance calculation appears below the map
5. **Export**: Use "Export as GPX" to download your route
6. **Clear**: Use "Clear All Waypoints" to start over

### Classic Route Creator

1. **Select Activity Type**: Choose between running, cycling, or walking
2. **Start Creating**: Click "Start Creating Route" to begin
3. **Add Points**: Click on the map to add route points
4. **Name Your Route**: Enter a descriptive name for your route
5. **Save**: Click "Save Route" when you're satisfied with your route
6. **Export**: Download your route as a GPX file for use in fitness apps

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
