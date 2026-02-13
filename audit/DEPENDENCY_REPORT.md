# Dependency Audit

## Applications Checked

### 1. `apps/web` (Frontend)

- **React**: `^19.2.0`
- **Vite**: `^6.0.0`
- **TypeScript**: `~5.9.3`
  - _Note: This TypeScript version seems unusually high (standard latest is ~5.7.x)._
- **Other Key Deps**:
  - `react-router-dom`: `^7.13.0`
  - `tailwindcss`: `^4.1.18`
  - `@tanstack/react-query`: `^5.90.20`

### 2. `apps/api` (Backend)

- **NestJS Core**: `^11.0.1`
- **TypeScript**: `^5.7.3`
- **Prisma Client**: `^5.22.0`
- **Key Deps**:
  - `passport`: `^0.7.0`
  - `rxjs`: `^7.8.1`

## Status

Both `package.json` files appear to be well-formed JSON.
