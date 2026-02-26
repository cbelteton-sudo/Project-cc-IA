# UI Skin V1 - Field Module

## Concepto

Aplicación de un diseño premium, limpio e inspirado en software enterprise moderno (SALI/MAWI) exclusivamente para el flujo core de Campo (Field Module).

## Principios

1. **Tipografía y Contraste:** Uso de grises oscuros (gray-800/900) para texto principal, grises medios para secundaria. Fondos blancos con bordes sutiles (gray-100).
2. **Botones Consistentes:**
   - **Primary:** Fondo negro (`bg-black text-white hover:bg-gray-800`), sombras sutiles.
   - **Secondary/Cancel:** Estilos transparentes con hover (`hover:bg-gray-100 text-gray-600`).
   - **Destructive/Action:** Uso medido de `bg-red-600` o `bg-blue-600` solo para CTAs muy específicos.
3. **Badges/Chips (Estados):**
   - Alta legibilidad, colores pasteles con texto oscuro (ej. `bg-green-100 text-green-800`).
4. **Layout:**
   - Espaciados generosos (`p-4` a `p-6`).
   - Bordes redondeados más orgánicos (`rounded-2xl` para tarjetas grandes, `rounded-xl` para secundarias).
   - "Mobile-first" pero escalable a desktop, con flexbox fluido.

## Vistas Impactadas

- **`FieldDashboard.tsx` (List by project):**
  - Tarjetas de lista rediseñadas.
  - Mejor barra superior de filtros y progreso de proyecto.
- **`FieldEntryDetail.tsx` (Create/Detail Daily Log & Photo):**
  - Botón principal de "Guardar Reporte" adherido a estándares.
  - Headers flotantes (sticky) más nítidos.
  - Sección de fotos (evidencia) más intuitiva.
- **`IssueTracker.tsx` (Create Issue):**
  - Modal rediseñado con fondo `backdrop-blur` y animaciones suaves de entrada.
  - Inputs limpios (`bg-gray-50 focus:bg-white focus:ring-2`).

## Deuda Visual / Next Steps (Polish Final)

- Migrar componentes a una librería sólida como Radix UI de manera global.
- Homogeneizar los modales en otras áreas (Project, Users). (Fuera de scope por ahora).
- Implementar skeletons reales en carga inicial (reemplazando "Loading...").
