# Xerez4Change-Dashboard

Dashboard de monitorización de vibraciones en vía férrea para el proyecto Xerez4Change.  
Visualiza en tiempo real coordenadas GPS con colores dinámicos según el nivel de vibración, filtros por fecha/tren/anomalía y un diseño tipo cabina de control en modo oscuro.

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| React 19 + TypeScript | Framework UI con tipado estricto |
| Vite 7 | Bundler ultrarrápido con HMR |
| Tailwind CSS 3 | Estilos utility-first, modo oscuro |
| Leaflet + react-leaflet | Mapa interactivo con capa CartoDB Dark Matter |
| Zustand | Estado global ligero (store reactivo) |

---

## Estructura del Proyecto

```
src/
├── components/
│   ├── GeoMap.tsx          # Mapa Leaflet con marcadores de colores, leyenda y stats
│   └── FilterBar.tsx       # Barra de filtros (fecha, tren, anomalía)
├── hooks/
│   └── useGeoData.ts       # Hook que carga los puntos GPS y alimenta el store
├── services/
│   └── geoService.ts       # Servicio de datos (mock ahora, API real después)
├── store/
│   └── dashboardStore.ts   # Estado global con Zustand (puntos, filtros, loading)
├── utils/
│   └── vibration.ts        # Clasificación de vibración, colores, formateo
├── types.ts                # Tipos TypeScript: GeoPoint, DashboardFilters
├── App.tsx                 # Layout principal del dashboard
├── main.tsx                # Punto de entrada de React
└── index.css               # Tailwind + estilos oscuros para popups de Leaflet
```

---

## Instalación y arranque

```bash
# Instalar dependencias
npm install

# Arrancar servidor de desarrollo (http://localhost:5173)
npm run dev

# Compilar para producción
npm run build
```

---

## Flujo completo de datos

El recorrido de un punto GPS desde su origen hasta que se pinta en el mapa es:

```
geoService.ts  →  useGeoData.ts  →  dashboardStore.ts  →  App.tsx  →  GeoMap.tsx
  (origen)         (cargador)        (almacén global)      (orquesta)   (pinta)
```

1. **`geoService.ts`** — Proporciona los datos (mock o API real).
2. **`useGeoData.ts`** — Al montar el componente, llama al servicio y guarda los puntos en el store.
3. **`dashboardStore.ts`** — Almacena todos los puntos y aplica los filtros activos automáticamente.
4. **`App.tsx`** — Lee `filteredPoints` del store y los pasa al mapa.
5. **`GeoMap.tsx`** — Pinta cada punto como un `CircleMarker` con color y radio según vibración.

---

## Descripción de cada archivo

### `src/types.ts` — Tipos del dominio

Define la forma exacta de los datos que maneja toda la app:

**`GeoPoint`** — cada punto que aparece en el mapa:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Identificador único (`"p001"`, `"p002"`, ...) |
| `lat` / `lon` | `number` | Coordenadas GPS (sistema WGS-84) |
| `vibration` | `number` | Valor de vibración en **g** (aceleración gravitacional) |
| `level` | `'ok' \| 'warning' \| 'critical'` | Nivel de severidad. **Se calcula automáticamente** a partir de `vibration` |
| `trainId` | `string` | Identificador del tren que generó la medición |
| `timestamp` | `string` | Fecha/hora en formato ISO (`"2026-03-05T08:15:00Z"`) |
| `frequencyHz` | `number?` | *(Opcional)* Frecuencia dominante del análisis espectral |
| `anomalyType` | `string?` | *(Opcional)* Tipo de anomalía detectada |

**`DashboardFilters`** — filtros del usuario:

- `dateRange`: par de fechas `[inicio, fin]` o `null`
- `trainId`: un tren concreto o `null` (todos)
- `anomalyType`: un tipo de anomalía concreto o `null` (todas)

---

### `src/services/geoService.ts` — Servicio de coordenadas GPS

**Es EL ÚNICO archivo que hay que tocar cuando lleguen datos reales del arquitecto.**

Contiene un array `MOCK_DATA` con **18 puntos simulados** en 3 tramos:

- **Jerez de la Frontera** (T-101): 5 puntos, de normal a crítico
- **El Puerto de Santa María** (T-102): 5 puntos, con avisos
- **Cádiz** (T-103): 5 puntos, con un pico crítico
- **Datos de ayer** (T-101 histórico): 3 puntos para comparación temporal

Funciones exportadas:

| Función | Qué hace |
|---|---|
| `fetchGeoPoints()` | Devuelve **todos** los puntos GPS (con 300ms de latencia simulada). **Esta es la que se sustituye** cuando haya API |
| `fetchTrainIds()` | Devuelve lista de IDs de tren únicos (alimenta el desplegable) |
| `fetchAnomalyTypes()` | Devuelve lista de anomalías únicas (alimenta el otro desplegable) |

La función `enrichPoints()` toma los datos crudos (sin `level`) y **calcula automáticamente** el nivel llamando a `classifyVibration()`. El arquitecto **no necesita enviar el campo `level`** — solo `lat`, `lon`, `vibration`, `trainId` y `timestamp`.

**Cómo cambiar a datos reales:**

```ts
// ANTES (mock):
export async function fetchGeoPoints(): Promise<GeoPoint[]> {
  await new Promise((r) => setTimeout(r, 300));
  return enrichPoints(MOCK_DATA);
}

// DESPUÉS (API real):
export async function fetchGeoPoints(): Promise<GeoPoint[]> {
  const res = await fetch('https://tu-api.com/api/geopoints');
  const raw = await res.json();
  return enrichPoints(raw);
}
```

---

### `src/utils/vibration.ts` — Utilidades de vibración

Centraliza **toda la lógica de semáforo**. Si queréis cambiar cuándo un punto es "crítico" o "aviso", **solo se toca aquí**.

**Umbrales actuales:**

| Rango de vibración | Nivel | Color | Radio en mapa |
|---|---|---|---|
| < 0.3 g | `ok` | Verde `#10b981` | 6px (pequeño) |
| 0.3 – 0.7 g | `warning` | Ámbar `#f59e0b` | 9px (mediano) |
| ≥ 0.7 g | `critical` | Rojo `#ef4444` | 12px (grande) |

Para ajustar umbrales, editar las constantes:

```ts
const THRESHOLDS = {
  warning: 0.3,   // ← cambiar si el arquitecto define otro umbral
  critical: 0.7,  // ← cambiar aquí
};
```

Helpers de formateo:

- `formatVibration(0.45)` → `"0.450 g"`
- `formatTimestamp("2026-03-05T08:15:00Z")` → `"05/03/2026, 08:15:00"`

---

### `src/store/dashboardStore.ts` — Estado global (Zustand)

Almacén central que todos los componentes comparten.

**Estado:**

| Propiedad | Descripción |
|---|---|
| `points` | **TODOS** los puntos GPS (sin filtrar) |
| `filteredPoints` | Puntos **después de aplicar filtros** (lo que se pinta en el mapa) |
| `filters` | Filtros activos del usuario |
| `loading` | `true` mientras se cargan datos |
| `error` | Mensaje de error si falla la carga |

**Acciones:**

| Acción | Qué hace |
|---|---|
| `setPoints(data)` | Guarda los puntos y aplica automáticamente los filtros activos |
| `setFilters({ trainId: 'T-101' })` | Actualiza un filtro y recalcula `filteredPoints` al instante |
| `resetFilters()` | Limpia todos los filtros → muestra todos los puntos |
| `setLoading(true/false)` | Activa/desactiva el spinner |
| `setError("mensaje")` | Muestra error en pantalla |

Cada vez que se cambia un filtro, `applyFilters()` recorre todos los puntos y devuelve solo los que pasan las 3 condiciones (fecha, tren, anomalía). El mapa se actualiza **automáticamente**.

---

### `src/hooks/useGeoData.ts` — Hook de carga de datos

Puente entre el servicio y los componentes React:

1. Cuando el componente se monta → pone `loading: true`
2. Llama a `fetchGeoPoints()` del servicio
3. Si va bien → guarda los puntos en el store con `setPoints(data)`
4. Si falla → guarda el error con `setError(mensaje)`
5. Devuelve `{ points, loading, error }` para el componente

La variable `cancelled` es un patrón de seguridad: si el componente se desmonta antes de que termine la carga, evita actualizar un componente que ya no existe.

Para datos en tiempo real, este hook se puede convertir en un listener de WebSocket:

```ts
useEffect(() => {
  const ws = new WebSocket('wss://tu-api.com/live');
  ws.onmessage = (e) => setPoints(JSON.parse(e.data));
  return () => ws.close();
}, []);
```

---

### `src/components/GeoMap.tsx` — Mapa interactivo

Componente **puramente visual**. Recibe `data: GeoPoint[]` y pinta:

- **`MapContainer`**: contenedor Leaflet centrado en Jerez–Cádiz (`[36.62, -6.20]`, zoom 12)
- **`TileLayer`**: capa CartoDB Dark Matter (mapa oscuro)
- **Por cada punto → `CircleMarker`**:
  - Color: verde/ámbar/rojo según vibración
  - Radio: 6/9/12px según nivel
  - Borde más grueso si es crítico
  - **Hover (Tooltip)**: tren + vibración rápido
  - **Click (Popup)**: detalle completo (nivel, tren, vibración, frecuencia, anomalía, fecha)
- **`Legend`**: leyenda flotante abajo-izquierda con los 3 colores y rangos
- **`Stats`**: contador flotante arriba-derecha (total puntos, avisos, críticos)

---

### `src/components/FilterBar.tsx` — Barra de filtros

- **2 inputs de fecha** (inicio → fin): filtran por `timestamp`
- **Desplegable de trenes**: alimentado automáticamente con los `trainId` únicos
- **Desplegable de anomalías**: alimentado con los `anomalyType` únicos
- **Botón "Limpiar"**: resetea todos los filtros

Cada cambio llama a `setFilters()` → recalcula `filteredPoints` → el mapa se repinta con los puntos filtrados.

---

### `src/App.tsx` — Layout principal

1. Llama a `useGeoData()` → obtiene `points`, `loading`, `error`
2. Muestra cabecera (nombre del proyecto + fecha)
3. Muestra `FilterBar` (barra de filtros)
4. Si `loading` → spinner de carga
5. Si `error` → mensaje de error en rojo
6. Si todo ok → pinta `GeoMap` con los puntos filtrados

---

## Pruebas a realizar

### Pruebas visuales (abrir http://localhost:5173)

| # | Prueba | Qué verificar |
|---|---|---|
| 1 | Carga inicial | Se ven ~18 puntos de colores en la zona de Jerez–Cádiz |
| 2 | Colores correctos | Verdes (vibración baja), ámbar (media), rojos (alta) |
| 3 | Hover sobre un punto | Aparece tooltip con tren + vibración |
| 4 | Click en un punto | Popup con todos los detalles |
| 5 | Leyenda | Aparece abajo-izquierda con 3 colores y rangos |
| 6 | Contadores | Arriba-derecha muestra totales correctos |
| 7 | Filtro por tren | Seleccionar "T-101" → solo se ven puntos de ese tren |
| 8 | Filtro por anomalía | Seleccionar "pico crítico" → solo puntos con esa anomalía |
| 9 | Filtro por fecha | Poner solo el 04/03/2026 → solo 3 puntos (los de ayer) |
| 10 | Limpiar filtros | Click en "Limpiar" → vuelven todos los puntos |
| 11 | Zoom y pan | El mapa se puede hacer zoom y arrastrar |
| 12 | Modo oscuro | Todo es oscuro: mapa, fondo, filtros, popups |

### Pruebas de datos (modificar `src/services/geoService.ts`)

| # | Prueba | Cómo |
|---|---|---|
| 13 | Añadir un punto | Añadir un objeto más a `MOCK_DATA` → aparece en el mapa |
| 14 | Cambiar vibración | Cambiar `vibration: 0.12` a `0.90` → el punto pasa a rojo y grande |
| 15 | Dato vacío | Dejar `MOCK_DATA = []` → el mapa sale vacío, contadores en 0 |

### Prueba de umbrales (modificar `src/utils/vibration.ts`)

| # | Prueba | Cómo |
|---|---|---|
| 16 | Cambiar umbral | Cambiar `warning: 0.3` a `0.5` → menos puntos ámbar, más verdes |

---

## Referencia rápida: ¿dónde toco qué?

| Necesidad | Archivo a editar |
|---|---|
| Cambiar datos de prueba / conectar API real | `src/services/geoService.ts` |
| Cambiar umbrales verde/ámbar/rojo | `src/utils/vibration.ts` |
| Cambiar centro/zoom del mapa | `src/components/GeoMap.tsx` (constantes `DEFAULT_CENTER` y `DEFAULT_ZOOM`) |
| Cambiar aspecto visual del popup/tooltip | `src/components/GeoMap.tsx` |
| Añadir un filtro nuevo | `src/types.ts` + `src/store/dashboardStore.ts` + `src/components/FilterBar.tsx` |
| Cambiar colores del tema | `tailwind.config.js` |
