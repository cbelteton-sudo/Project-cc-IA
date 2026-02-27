# Field Command Center: UAT & Responsive Validation

## Objetivo
Dejar el *Field Management* utilizable bajo un enfoque Mobile-First para operarios y residentes en los entornos de producción/staging, aislando completamente su contexto al proyecto y módulo asignado.

---

## 1. Diseño Responsivo (Mobile-First)
El módulo "Gestión de Campo" fue adaptado y verificado para pantallas móviles sin romper la experiencia en desktop/tablet:

*   **Layout & Navegación:** Se implementó un *Hamburger Menu* (Menú de Sandwich) para pantallas móviles (`md:hidden`), permitiendo acceder a las opciones lateral ocultando el Sidebar por defecto, de manera que el panel aprovecha el 100% del acho del dispositivo.
*   **KPI Cards:** Utiliza `overflow-x-auto` logrando un swipe horizontal fluido tipo carrusel en móviles.
*   **Listado de Registros:** Rejilla flexible que se apila en forma de tabla a una sola columna en pantallas pequeñas.
*   **Quick Create:** Aprovecha componentes modales como "Bottom-Sheets" (hojas inferiores) que maximizan el área táctil en celular, haciéndolo nativo. Se implementó un *Floating Action Button* (FAB) permanente en móviles en la esquina inferior derecha.

---

## 2. RBAC y Navegación Restringida (UAT Profiles)
Los roles de **Operario** y **Residente** operan bajo el identificador interno de sistema `FIELD_OPERATOR`. Para garantizar una experiencia enfocada y "a prueba de errores" se ejecutaron las siguientes restricciones programáticas:

1.  **Bloqueo de Organización:** Los usuarios con rol exclusivo de Operario (`FIELD_OPERATOR`) y rol de organización `VIEWER` no verán los módulos globales de "Inicio" o "Proyectos" en el menú, ni el botón de "Volver a Org".
2.  **Contexto Cerrado:** Solamente pueden acceder al proyecto asignado.
3.  **Filtrado de Módulos:** Toda funcionalidad "No Responsiva" o ajena al campo (como Presupuesto, Equipo, Ajustes, Plan de Trabajo) queda oculta y bloqueada. El operador únicamente visualiza y accede a "Gestión de Campo" > "Actividad".

---

## 3. Credenciales UAT (Proyecto Demostrativo)

Se creó un Seed Script preparado para generar datos de prueba reproducibles (`apps/api/src/scripts/seed-uat-responsive-field.ts`).

**Ejecución del script en Staging (Railway):**
```bash
npx ts-node src/scripts/seed-uat-responsive-field.ts
```
*(O desde la terminal local si la base de datos está levantada)*

### Usuarios y Contexto:
*   **Tenant:** Constructora Demo (`demo.com`)
*   **Proyecto Aislado:** `FIELD_DEMO_UAT`
*   **Contraseña Universal:** `CConstructions2026!`

| Correo / Usuario | Nivel en Proyecto | Módulos Visibles |
| :--- | :--- | :--- |
| `operario_1@uat.com` | `FIELD_OPERATOR` (Operario) | Solo "Actividad" en `FIELD_DEMO_UAT`. |
| `operario_2@uat.com` | `FIELD_OPERATOR` (Operario) | Solo "Actividad" en `FIELD_DEMO_UAT`. |
| `residente_1@uat.com` | `FIELD_OPERATOR` (Residente) | Solo "Actividad" en `FIELD_DEMO_UAT`. |
| `supervisor_1@uat.com`| `SUPERVISOR` (Gestión) | Verá panel extendido (Presupuesto oculto, Equipo visible). |

---

## 4. Checklist de Validación Móvil (PASS / FAIL)

Ejecutar las siguientes pruebas desde un teléfono celular real o emulador apuntando al entorno de despliegue:

- [ ] **Aislamiento visual:** Entrar como `operario_1@uat.com`, verificar que el Sidebar solo contenga "Actividad" y no exista "Inicio" ni "Presupuesto".
- [ ] **Navegación Táctil:** Probar pulsar el Menú de Hamburguesa en la cabecera superior; la barra lateral oculta debe deslizarse adecuadamente.
- [ ] **Quick Create:** Pulsar el botón flotante flotante negro `+`, verificar que el Cajón Inferior se levante y el teclado táctil no oculte información crítica del formulario. Crear un issue de prueba y dar "Guardar".
- [ ] **Listado y Filtros:** Verificar que las tarjetas resumen del issue creado sean legibles, pulsarla para ir a la Vista de Detalle y comprobar que todo ocupa 1 columna a lo ancho.
- [ ] **Error Hygiene:** Intentar acceder a la fuerza a la URL de *Resumen* (ej. `/projects/FIELD_DEMO_UAT/overview`); la aplicación debe ser un Error Boundary silencioso o redirigir sin romper el Frontend en un error tipo JSON nativo.

**Criterios de Aceptación Cumplidos:**
- [x] Arquitectura RBAC + UI Oculta preparada.
- [x] Componentes adaptados con Tailwind responsive (`md:hidden`, `flex-col`, modals en `max-h-screen`).
- [x] Scripts generados y documentados.
