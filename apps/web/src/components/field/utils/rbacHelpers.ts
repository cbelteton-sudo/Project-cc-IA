import type { User } from '@/context/AuthContext';

/**
 * Validates if the given user has the capability to assign tasks
 */
export function canReassign(user: User | null): boolean {
  if (!user || !user.role) return false;
  // Residente, Supervisor y Director PMO pueden reasignar
  return ['PROJECT_MANAGER', 'RESIDENTE', 'DIRECTOR_PMO', 'PLATFORM_ADMIN'].includes(user.role);
}

/**
 * Validates if the given user has the capability to approve or reject closure of records
 */
export function canApprove(user: User | null): boolean {
  if (!user || !user.role) return false;
  // Solo Supervisor y superiores pueden aprobar/rechazar cierres técnicos
  return ['PROJECT_MANAGER', 'DIRECTOR_PMO', 'PLATFORM_ADMIN'].includes(user.role);
}

/**
 * Validates if the given user has the capability to technically close a record
 */
export function canClose(user: User | null): boolean {
  if (!user || !user.role) return false;
  // Residente y superiores pueden cerrar
  return ['PROJECT_MANAGER', 'RESIDENTE', 'DIRECTOR_PMO', 'PLATFORM_ADMIN'].includes(user.role);
}

/**
 * Helper to check if user can only comment/view
 */
export function isBasicOperator(user: User | null): boolean {
  if (!user || !user.role) return true;
  return user.role === 'OPERADOR';
}
