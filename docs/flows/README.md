# Documentación de Flujos (Mermaid)

Este directorio contiene diagramas Mermaid (`.mmd`) que ilustran la arquitectura, flujos de usuario y procesos clave del sistema.

## Índice de Diagramas

### 1. [Overview General](./01-overview.mmd)
Muestra la arquitectura de alto nivel: interacción entre Usuario, Frontend (Web/Mobile), API NestJS y Base de Datos.
```mermaid
flowchart TD
    %% Nodes
    User([Usuario])
    subgraph Frontend [Web App]
        Login[Login Page]
        Dashboard[Dashboard]
        Projects[Lista de Proyectos]
        ProjectDetail[Detalle Proyecto]
        WBS[Planificación / WBS]
        Field[Módulo de Campo]
    end

    subgraph Backend [API NestJS]
        AuthCtrl[Auth Controller]
        ProjectsCtrl[Projects Controller]
        ActivitiesCtrl[Activities Controller]
        FieldCtrl[FieldUpdates Controller]
        IssuesCtrl[Issues Controller]
    end

    subgraph Database [SQLite / Prisma]
        UserDB[(User)]
        ProjectDB[(Project)]
        ActivityDB[(ProjectActivity)]
        UpdateDB[(FieldUpdate)]
        IssueDB[(Issue)]
    end

    %% Flows
    User -->|Credenciales| Login
    Login -->|POST /auth/login| AuthCtrl
    AuthCtrl -.->|JWT Token| User
    
    User -->|Navega| Dashboard
    Dashboard -->|Selecciona| Projects
    Projects -->|GET /projects| ProjectsCtrl
    ProjectsCtrl -->|Query| ProjectDB
    
    User -->|Crea Proyecto| Projects
    Projects -->|POST /projects| ProjectsCtrl
    
    User -->|Gestiona Cronograma| WBS
    WBS -->|GET/POST /activities| ActivitiesCtrl
    ActivitiesCtrl <-->|R/W| ActivityDB
    
    User -->|Reporta Avance| Field
    Field -->|POST /field-updates| FieldCtrl
    FieldCtrl -->|Save| UpdateDB
    
    User -->|Reporta Problema| Field
    Field -->|POST /issues| IssuesCtrl
    IssuesCtrl -->|Save| IssueDB

    %% Styling
    classDef box fill:#f9f9f9,stroke:#333,stroke-width:2px;
    class Frontend,Backend,Database box;
```

### 2. [Gestión de Proyectos](./02-proyectos.mmd)
Secuencia de creación y configuración inicial de un proyecto (Presupuesto, Fechas).
```mermaid
sequenceDiagram
    participant PM as Project Manager
    participant UI as Web Interface
    participant API as API Controller
    participant DB as Database

    %% Creating Project
    PM->>UI: Clic en "Nuevo Proyecto"
    UI->>PM: Muestra modal de creación
    PM->>UI: Ingresa Nombre, Código, Fechas, Presupuesto
    UI->>API: POST /projects (CreateProjectDto)
    Note right of UI: Valida campos requeridos
    API->>DB: INSERT INTO Project
    DB-->>API: Retorna Project Created
    API-->>UI: 201 Created + Datos
    UI->>PM: Redirige a /projects/:id

    %% Initial Configuration
    PM->>UI: Configura Presupuesto Global
    UI->>API: PATCH /projects/:id (budget)
    API->>DB: UPDATE Project SET globalBudget = ...
    DB-->>API: OK
    API-->>UI: 200 OK

    %% Navigation
    PM->>UI: Accede a "Plan de Proyecto" (WBS)
    UI->>API: GET /projects/:id/plan
    API->>DB: SELECT * FROM ProjectActivity WHERE projectId = ...
    DB-->>API: Return activities
    API-->>UI: Renderiza Árbol de Actividades
```

### 3. [WBS y Actividades](./03-actividades.mmd)
Estructura jerárquica de actividades y asignación de contratistas.
```mermaid
graph TD
    subgraph WBS [Estructura de Desglose de Trabajo]
        Root[Proyecto Raíz]
        Phase1[Fase 1: Cimentación]
        Phase2[Fase 2: Estructura]
        Act1[Excavación]
        Act2[Colado]
        Act3[Levantamiento Muros]
        
        Root --> Phase1
        Root --> Phase2
        Phase1 --> Act1
        Phase1 --> Act2
        Phase2 --> Act3
    end

    subgraph Assignments [Asignaciones]
        Cont1[Contratista A: Movimiento Tierras]
        Cont2[Contratista B: Obra Civil]
        
        Act1 -.->|Asignado a| Cont1
        Act2 -.->|Asignado a| Cont2
        Act3 -.->|Asignado a| Cont2
    end
    
    subgraph Interactions [Acciones UI]
        PM[Project Manager]
        PM -->|Drag & Drop| Root
        PM -->|Crear Hijo| Phase1
        PM -->|Editar Fechas| Act1
        PM -->|Asignar Contratista| Assignments
    end
    
    %% Styles
    classDef phase fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef activity fill:#fff9c4,stroke:#fbc02d,stroke-width:1px;
    class Root,Phase1,Phase2 phase;
    class Act1,Act2,Act3 activity;
```

### 4. [Evidencia de Campo](./04-evidencia.mmd)
Flujo de reporte de avance desde campo (App móvil/web), soporte offline y carga de fotos.
```mermaid
sequenceDiagram
    participant User as Residente/Supervisor
    participant App as Mobile/Web App
    participant API as API NestJS
    participant S3 as Storage (Photos)
    participant DB as SQLite DB

    %% Start Report
    User->>App: Selecciona Actividad en "FieldToday"
    App->>User: Muestra formulario "FieldEntryDetail"
    
    %% Capture Evidence
    User->>App: Toma Foto / Sube Imagen
    App->>S3: Upload Photo (Direct / SignedURL)
    S3-->>App: Return URL (urlMain, urlThumb)
    
    %% Input Data
    User->>App: Ingresa Progreso (%, Cantidad)
    User->>App: Agrega Notas / Observaciones
    
    %% Submit
    User->>App: Clic "Guardar Avance"
    
    alt Online
        App->>API: POST /field-updates/draft
        API->>DB: INSERT FieldUpdate + FieldUpdateItems
        API->>DB: INSERT Photo records
        DB-->>API: Success
        API-->>App: 201 Created
        App->>User: Confirmación "Guardado exitoso"
    else Offline
        App->>App: Guarda en IndexedDB (Cola Sincronización)
        App->>User: "Guardado localmente (Offline)"
        Note right of App: Background Sync activado al recuperar conexión
    end

    %% Timeline View
    User->>App: Ver Historial de Actividad
    App->>API: GET /activities/:id (include updates)
    API->>DB: SELECT updates, photos FROM ...
    DB-->>API: Data
    API-->>App: JSON Response
    App->>User: Renderiza Timeline con Fotos
```

### 5. [Ciclo de vida de Issues](./05-punchlist.mmd)
Estados y transiciones de problemas (Punchlist).
```mermaid
stateDiagram-v2
    state "ABIETO" as OPEN
    state "EN PROGRESO" as IN_PROGRESS
    state "BLOQUEADO" as BLOCKED
    state "RESUELTO" as DONE
    state "CERRADO" as CLOSED

    [*] --> OPEN: Reportado por Residente
    
    OPEN --> IN_PROGRESS: Asignado a Contratista/Responsable
    OPEN --> BLOCKED: Falta de información/recursos
    
    IN_PROGRESS --> DONE: Trabajo completado
    IN_PROGRESS --> BLOCKED: Impedimento surgido
    
    BLOCKED --> IN_PROGRESS: Impedimento resuelto
    BLOCKED --> OPEN: Reasignación necesaria
    
    DONE --> CLOSED: Verificado por PM/Supervisor
    DONE --> IN_PROGRESS: Rechazado (Correcciones)
    
    CLOSED --> [*]
    
    note right of OPEN
        Severidad: HIGH, MEDIUM, LOW, CRITICAL
        Creado con foto/evidencia inicial
    end note
    
    note right of BLOCKED
        Requiere "Blocked Reason"
        y fecha estimada de resolución
    end note
```

### 6. [Roles y Permisos](./06-roles.mmd)
Matriz de acceso por rol (Admin, PM, Usuario, Contratista).
```mermaid
graph TD
    subgraph Auth [Autenticación]
        Login[Pantalla Login] -- Credenciales --> API_Auth[POST /auth/login]
        API_Auth -- Valida --> DB_User[(Tabla User)]
        DB_User -- Retorna Role + TenantId --> API_Auth
        API_Auth -- Token JWT --> Client[Cliente Web]
    end

    subgraph Roles [Roles y Permisos]
        Admin((Administrador))
        PM((Project Manager))
        User((Usuario Estandar / Residente))
        Contractor((Contratista / Portal))
        
        Admin -->|Full Access| Config[Configuración Tenant]
        Admin -->|Gestiona| Users[Usuarios y Contratistas]
        
        PM -->|Gestiona| Projects[Proyectos y Presupuestos]
        PM -->|Aprueba| Estimates[Estimaciones de Pago]
        
        User -->|Registra| DailyLog[Bitácora Diaria]
        User -->|Reporta| Issues[Problemas en Campo]
        User -.->|Solo Lectura| Budget[Presupuesto (Limitado)]
        
        Contractor -->|Acceso Portal| Portal[Portal de Proveedores]
        Portal -->|Visualiza| RFI[RFIs y RFQs]
        Portal -->|Carga| Invoices[Facturas]
    end
    
    Client -->|Bearer Token| ProtectedRoutes{Rutas Protegidas}
    ProtectedRoutes -- Role Check --> View[Vista Permitida]
    
    %% Styling
    classDef role fill:#fce4ec,stroke:#880e4f,stroke-width:2px;
    class Admin,PM,User,Contractor role;
```

## Cómo ver los diagramas

1. **GitHub / GitLab**: Los archivos `.mmd` y este `README.md` se renderizan automáticamente.
2. **VS Code**: Instala la extensión **"Mermaid Preview"** o **"Markdown Preview Mermaid Support"**.

## Exportar a Imágenes (PNG/SVG)

Se incluye un script utilitario para exportar todos los diagramas a imágenes usando `mmdc` (Mermaid CLI) vía `npx`. No requiere instalar dependencias globales.

### Requisitos
- Node.js instalado
- Acceso a internet (para descargar `mermaid-cli` la primera vez)

### Uso
Desde la raíz del proyecto:

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x docs/flows/export-diagrams.sh

# Ejecutar script
./docs/flows/export-diagrams.sh
```

Esto generará archivos `.png` en la misma carpeta `docs/flows/`.
