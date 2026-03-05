// ─── Hook para cargar y gestionar datos GPS ───
import { useEffect } from 'react';
import { fetchGeoPoints } from '../services/geoService';
import { useDashboardStore } from '../store/dashboardStore';

/**
 * Hook que carga los puntos GPS al montar el componente
 * y los inyecta en el store global.
 * 
 * Cuando el arquitecto pase datos en tiempo real,
 * aquí se sustituye fetchGeoPoints por un WebSocket o SSE.
 */
export function useGeoData() {
  const { setPoints, setLoading, setError, filteredPoints, loading, error } =
    useDashboardStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchGeoPoints();
        if (!cancelled) setPoints(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [setPoints, setLoading, setError]);

  return { points: filteredPoints, loading, error };
}
