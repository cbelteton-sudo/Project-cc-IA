# Stack Tecnológico Detectado

## Frontend (apps/web)
- **Framework**: React 19
- **Build Tool**: Vite 6
- **Language**: TypeScript 5.9
- **Styling**: TailwindCSS 4
- **State Management**: React Query (@tanstack/react-query), React Context (inferred from lack of Redux/Zustand in deps, though Context is built-in)
- **Routing**: React Router 7
- **Forms**: React Hook Form + Zod + @hookform/resolvers
- **UI Components**: Radix UI (via `class-variance-authority`, `clsx`, `lucide-react`, though direct Radix deps aren't explicitly top-level, likely internal or shadcn/ui pattern), dnd-kit (drag and drop)
- **Utilities**: date-fns, axios, uuid, i18next
- **Visualization**: Recharts

## Backend (apps/api)
- **Framework**: NestJS 11
- **Language**: TypeScript 5.7
- **Database ORM**: Prisma 5.22
- **Auth**: Passport, JWT, Bcrypt
- **Validation**: class-validator, class-transformer
- **PDF Generation**: PDFKit
- **Image Processing**: Sharp

## Base de Datos
- **Tipo**: SQLite (inferred from `dev.db` and Prisma config `provider = "sqlite"`)
- **Schema definido**: Sí (`prisma/schema.prisma`)
- **Migraciones**: Prisma Migrate (inferred from usage of Prisma)

## DevOps/Infra
- **Package Manager**: pnpm (Monorepo)
- **Linting**: ESLint 9
- **Formatting**: Prettier
- **Testing**: Jest (Backend), Vitest/Jest (Frontend not explicitly configured in top-level deps but likely available via vite config or not set up)
