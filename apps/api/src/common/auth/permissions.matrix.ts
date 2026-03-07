import { ProjectRole } from '../constants/roles';

export enum AccessScope {
  OWN_PROJECTS = 'OWN_PROJECTS',
  ASSIGNED_PROJECTS = 'ASSIGNED_PROJECTS',
  PORTFOLIO_PROJECTS = 'PORTFOLIO_PROJECTS',
  TENANT_WIDE = 'TENANT_WIDE',
}

export const roleHierarchy: Record<string, string[]> = {
  [ProjectRole.PROJECT_ADMIN]: [ProjectRole.DIRECTOR, ProjectRole.PM],
  [ProjectRole.DIRECTOR]: [ProjectRole.PM],
  [ProjectRole.PM]: [
    ProjectRole.FINANCIERO,
    ProjectRole.CONTRACTOR_LEAD,
    ProjectRole.SUPERVISOR,
  ],
  [ProjectRole.FINANCIERO]: [ProjectRole.VIEWER],
  [ProjectRole.CONTRACTOR_LEAD]: [ProjectRole.SUPERVISOR],
  [ProjectRole.SUPERVISOR]: [ProjectRole.RESIDENTE_OBRA],
  [ProjectRole.RESIDENTE_OBRA]: [ProjectRole.FIELD_OPERATOR],
  [ProjectRole.FIELD_OPERATOR]: [ProjectRole.VIEWER],
  [ProjectRole.VIEWER]: [],
  // Roles a nivel Tenant que abarcan más cosas
  PLATFORM_ADMIN: [ProjectRole.PROJECT_ADMIN, ProjectRole.DIRECTOR],
  DIRECTOR_PMO: [ProjectRole.PM],
};
