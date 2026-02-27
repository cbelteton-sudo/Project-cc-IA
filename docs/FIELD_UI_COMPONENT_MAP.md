# Field UI Component Map (v1.1)

Esta guía documenta la jerarquía de los nuevos componentes modulares del **Field Command Center** en `apps/web/src/components/field-v2/` u `apps/web/src/components/field/` (usando el Feature Flag).

## Directorio Base: `src/components/field/`

```text
src/components/field/
├── FieldDashboardV2.tsx          # Pantalla principal (Contenedor Smart)
├── components/
│   ├── KpiCardGroup.tsx          # Contenedor Horizontal/Grid para tarjetas de resumen numérico.
│   ├── KpiCard.tsx               # Tarjeta individual con color (Rojo, Azul, Verde, Morado), numero gigante.
│   ├── FilterBar.tsx             # Fila scrolleable horizontalmente en móviles con píldoras de filtro.
│   ├── FilterPill.tsx            # Píldora individual (ej. "issue", "daily_log", "inspection").
│   ├── RecordList.tsx            # Virtualized list para renderizar cientos de registros rápidos.
│   ├── KanbanBoard.tsx           # Vista alternativa (Swimlanes por Estado: Abierto, Progreso, Cerrado).
│   ├── RecordCard.tsx            # UI del item en lista/kanban (Título, Tag tipo, Tag Estado, Avatar asig).
│   ├── RecordDetailView.tsx      # Modal / Overlay side-panel con el detalle completo de un registro.
│   └── QuickCreateModal.tsx      # Flujo de creación rápida optimizado (<45s).
├── hooks/
│   ├── useFieldRecordsV2.ts      # React Query wrap sobre api.get('/api/field-records') con filtros paramétricos.
│   ├── useCreateFieldRecord.ts   # Mutación (Sincronización híbrida via OfflineManager).
│   └── useUpdateFieldRecordStatus.ts # Mutación rápida para cambiar de Open -> In Progress -> Closed.
└── utils/
    └── rbacHelpers.ts            # Utilidades visuales canApprove(record, user), canClose(record, user) en lugar de rol fijo.
```

## Patrones Arquitectónicos UI

### 1. El Pantallaso Único (Mobile First)

En resoluciones pequeñas (`sm` y `md`), el Dashboard ocupa 100% de alto:

- **Top:** KPIs reducidos a una fila horizontal scrolleable.
- **Mid:** Filtros horizontales scrolleables.
- **Cuerpo:** Lista infinita (RecordCards ocupando ancho total).
- **Bottom Right:** Floating Action Button (FAB) gigante de "+".

### 2. Renderizado Condicional por Estado (Error Boundary & Suspense fallbacks)

El componente Padre `FieldDashboardV2` administra:

- **Cargando:** Muestra `<ListSkeleton />` o `Skeleton Kpis`. NADA de textitos "Loading data...".
- **Vacio:** Componente `<EmptyState illustration="clipboard" message="¡Todo al día!" />`
- **Error:** Componente `<ErrorState error={error} onRetry={refetch} />` (Diseños limpios, sin JSON).

### 3. Modales Overlay System

- **Quick Create:** Pantalla modal de abajo hacia arriba (Bottom Sheet) en Mobile, y Modal central en Desktop. Maximiza área táctil.
- **Record Detail:** Se usa el mismo Bottom Sheet/Side Drawer. La navegación se siente instantánea.

## Vinculación al Router (Feature Flag)

El archivo `src/pages/field/FieldDashboard.tsx` decidirá cuál cargar:

```tsx
import { FieldDashboardLegacy } from './FieldDashboardLegacy';
import { FieldDashboardV2 } from '../../components/field/FieldDashboardV2';

export function FieldDashboard() {
  const isV2 = import.meta.env.VITE_FIELD_RECORDS_V1_FRONTEND === 'true';
  return isV2 ? <FieldDashboardV2 /> : <FieldDashboardLegacy />;
}
```
