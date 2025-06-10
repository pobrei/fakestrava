import RouteBuilder from '@/components/RouteBuilder';
import UnifiedRoutePanel from '@/components/UnifiedRoutePanel';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            GPX Route Creator
          </h1>
          <p className="text-gray-600 mt-1">
            Create interactive routes with drag-and-drop waypoints
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* GPX Form Demo */}
        <section className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                GPX Form with Validation
              </h2>
              <p className="text-gray-600 mt-1">
                Advanced form with react-hook-form, zod validation, and speed/pace conversion
              </p>
            </div>
            <Link href="/gpx-form">
              <Button>Try GPX Form Demo</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <strong>✅ Validation</strong>
              <br />Zod schema, activity-specific ranges
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>🔄 Conversion</strong>
              <br />Speed ↔ Pace with live preview
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>📱 UX</strong>
              <br />shadcn/ui, TypeScript, responsive
            </div>
          </div>
        </section>

        {/* Interactive Route Builder */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Interactive Route Builder
          </h2>
          <RouteBuilder />
        </section>

        {/* Unified Route Panel */}
        <section>
          <UnifiedRoutePanel />
        </section>
      </main>
    </div>
  );
}
