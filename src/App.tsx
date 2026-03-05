// src/App.tsx
import { GeoMap } from './components/GeoMap';
import { FilterBar } from './components/FilterBar';
import { useGeoData } from './hooks/useGeoData';

export default function App() {
  const { points, loading, error } = useGeoData();

  return (
    <div className="flex h-screen flex-col bg-surface-900 text-gray-100 font-sans">
      {/* ─── Cabecera ─── */}
      <header className="flex items-center gap-4 border-b border-surface-600 px-6 py-3">
        <h1 className="font-mono text-lg font-bold tracking-wide text-white">
          Xerez<span className="text-blue-400">4</span>Change
        </h1>
        <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-xs text-blue-300">
          Dashboard v0.1
        </span>
        <span className="ml-auto font-mono text-xs text-gray-500">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </header>

      {/* ─── Barra de filtros ─── */}
      <div className="px-6 pt-4">
        <FilterBar />
      </div>

      {/* ─── Panel principal: GeoMap ─── */}
      <main className="flex-1 p-6">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-red-400">Error: {error}</p>
          </div>
        )}
        {!loading && !error && <GeoMap data={points} />}
      </main>
    </div>
  );
}
