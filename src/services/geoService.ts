// ─── Servicio de coordenadas GPS ───
// Por ahora usamos datos mock. Cuando el arquitecto pase las coordenadas reales
// se sustituye fetchGeoPoints por la llamada a la API o lectura del JSON.

import type { GeoPoint } from '../types';
import { classifyVibration } from '../utils/vibration';

/** Datos de ejemplo simulando la zona de Jerez / línea férrea Cádiz */
const MOCK_DATA: Omit<GeoPoint, 'level'>[] = [
  // — Tramo Jerez de la Frontera —
  { id: 'p001', lat: 36.6850, lon: -6.1261, vibration: 0.12, trainId: 'T-101', timestamp: '2026-03-05T08:15:00Z' },
  { id: 'p002', lat: 36.6870, lon: -6.1230, vibration: 0.25, trainId: 'T-101', timestamp: '2026-03-05T08:15:05Z' },
  { id: 'p003', lat: 36.6892, lon: -6.1198, vibration: 0.45, trainId: 'T-101', timestamp: '2026-03-05T08:15:10Z', anomalyType: 'vibración elevada' },
  { id: 'p004', lat: 36.6915, lon: -6.1170, vibration: 0.78, trainId: 'T-101', timestamp: '2026-03-05T08:15:15Z', anomalyType: 'pico crítico', frequencyHz: 42.5 },
  { id: 'p005', lat: 36.6938, lon: -6.1140, vibration: 0.82, trainId: 'T-101', timestamp: '2026-03-05T08:15:20Z', anomalyType: 'pico crítico', frequencyHz: 45.0 },

  // — Tramo hacia El Puerto de Santa María —
  { id: 'p006', lat: 36.6600, lon: -6.1400, vibration: 0.08, trainId: 'T-102', timestamp: '2026-03-05T09:00:00Z' },
  { id: 'p007', lat: 36.6550, lon: -6.1500, vibration: 0.15, trainId: 'T-102', timestamp: '2026-03-05T09:00:05Z' },
  { id: 'p008', lat: 36.6500, lon: -6.1600, vibration: 0.35, trainId: 'T-102', timestamp: '2026-03-05T09:00:10Z', anomalyType: 'vibración elevada' },
  { id: 'p009', lat: 36.6450, lon: -6.1700, vibration: 0.52, trainId: 'T-102', timestamp: '2026-03-05T09:00:15Z', anomalyType: 'vibración elevada', frequencyHz: 38.0 },
  { id: 'p010', lat: 36.6400, lon: -6.1800, vibration: 0.18, trainId: 'T-102', timestamp: '2026-03-05T09:00:20Z' },

  // — Tramo Cádiz —
  { id: 'p011', lat: 36.5270, lon: -6.2885, vibration: 0.10, trainId: 'T-103', timestamp: '2026-03-05T10:30:00Z' },
  { id: 'p012', lat: 36.5300, lon: -6.2850, vibration: 0.42, trainId: 'T-103', timestamp: '2026-03-05T10:30:05Z', anomalyType: 'vibración elevada' },
  { id: 'p013', lat: 36.5330, lon: -6.2810, vibration: 0.71, trainId: 'T-103', timestamp: '2026-03-05T10:30:10Z', anomalyType: 'pico crítico', frequencyHz: 50.2 },
  { id: 'p014', lat: 36.5360, lon: -6.2770, vibration: 0.20, trainId: 'T-103', timestamp: '2026-03-05T10:30:15Z' },
  { id: 'p015', lat: 36.5390, lon: -6.2730, vibration: 0.05, trainId: 'T-103', timestamp: '2026-03-05T10:30:20Z' },

  // — Datos de ayer para comparación temporal —
  { id: 'p016', lat: 36.6850, lon: -6.1261, vibration: 0.10, trainId: 'T-101', timestamp: '2026-03-04T08:15:00Z' },
  { id: 'p017', lat: 36.6892, lon: -6.1198, vibration: 0.30, trainId: 'T-101', timestamp: '2026-03-04T08:15:10Z' },
  { id: 'p018', lat: 36.6915, lon: -6.1170, vibration: 0.55, trainId: 'T-101', timestamp: '2026-03-04T08:15:15Z', anomalyType: 'vibración elevada', frequencyHz: 40.1 },

// — Trayecto: Sevilla Santa Justa hacia Jerez (Hoy, 05 de Marzo) —
  { id: 'p101', lat: 37.3915, lon: -5.9755, vibration: 0.11, trainId: 'T-201', timestamp: '2026-03-05T09:00:00Z' }, // Salida Santa Justa
  { id: 'p102', lat: 37.3450, lon: -5.9580, vibration: 0.18, trainId: 'T-201', timestamp: '2026-03-05T09:05:00Z' }, // Zona Dos Hermanas
  { id: 'p103', lat: 37.1842, lon: -5.7830, vibration: 0.48, trainId: 'T-201', timestamp: '2026-03-05T09:15:00Z', anomalyType: 'vibración elevada' }, // Cerca de Utrera
  { id: 'p104', lat: 36.9850, lon: -5.9320, vibration: 0.76, trainId: 'T-201', timestamp: '2026-03-05T09:25:00Z', anomalyType: 'pico crítico', frequencyHz: 44.2 }, // Las Cabezas
  { id: 'p105', lat: 36.9210, lon: -6.0780, vibration: 0.85, trainId: 'T-201', timestamp: '2026-03-05T09:35:00Z', anomalyType: 'pico crítico', frequencyHz: 48.5 }, // Zona Lebrija
  { id: 'p106', lat: 36.8000, lon: -6.1150, vibration: 0.22, trainId: 'T-201', timestamp: '2026-03-05T09:45:00Z' }, // Entrada a la provincia de Cádiz
  { id: 'p107', lat: 36.6852, lon: -6.1265, vibration: 0.09, trainId: 'T-201', timestamp: '2026-03-05T09:55:00Z' }, // Llegada Jerez de la Frontera

  // — Segundo Tren en ruta (Hoy) —
  { id: 'p108', lat: 37.1842, lon: -5.7830, vibration: 0.35, trainId: 'T-202', timestamp: '2026-03-05T10:15:00Z', anomalyType: 'vibración elevada' },

  // — Datos de AYER (04 de Marzo) para comparación temporal en el mismo punto crítico —
  { id: 'p109', lat: 36.9850, lon: -5.9320, vibration: 0.52, trainId: 'T-201', timestamp: '2026-03-04T09:25:00Z', anomalyType: 'vibración elevada', frequencyHz: 39.8 },
  { id: 'p110', lat: 36.9210, lon: -6.0780, vibration: 0.61, trainId: 'T-201', timestamp: '2026-03-04T09:35:00Z', anomalyType: 'vibración elevada', frequencyHz: 41.2 }

];

/** Enriquecer los datos crudos con el nivel calculado */
function enrichPoints(raw: Omit<GeoPoint, 'level'>[]): GeoPoint[] {
  return raw.map((p) => ({
    ...p,
    level: classifyVibration(p.vibration),
  }));
}

/**
 * Obtener todos los puntos GPS.
 * Sustituir por fetch() cuando la API esté lista.
 */
export async function fetchGeoPoints(): Promise<GeoPoint[]> {
  // Simular latencia de red
  await new Promise((r) => setTimeout(r, 300));
  return enrichPoints(MOCK_DATA);
}

/** Obtener la lista de trenes únicos */
export async function fetchTrainIds(): Promise<string[]> {
  const points = await fetchGeoPoints();
  return [...new Set(points.map((p) => p.trainId))];
}

/** Obtener tipos de anomalía únicos */
export async function fetchAnomalyTypes(): Promise<string[]> {
  const points = await fetchGeoPoints();
  return [...new Set(points.filter((p) => p.anomalyType).map((p) => p.anomalyType!))];
}
