export enum ProjectRole {
  PROJECT_ADMIN = 'PROJECT_ADMIN',
  EXECUTIVE_VIEWER = 'EXECUTIVE_VIEWER',
  DIRECTOR = 'DIRECTOR',
  PM = 'PM',
  PMO = 'PMO',
  FINANCIERO = 'FINANCIERO',
  CONTRACTOR_LEAD = 'CONTRACTOR_LEAD',
  FIELD_OPERATOR = 'FIELD_OPERATOR',
  VIEWER = 'VIEWER', // Fallback
}

export const ROLE_HIERARCHY = {
  [ProjectRole.PROJECT_ADMIN]: 100,
  [ProjectRole.DIRECTOR]: 90,
  [ProjectRole.PM]: 80,
  [ProjectRole.PMO]: 75,
  [ProjectRole.EXECUTIVE_VIEWER]: 70, // High privilege read-only
  [ProjectRole.FINANCIERO]: 60,
  [ProjectRole.CONTRACTOR_LEAD]: 50,
  [ProjectRole.FIELD_OPERATOR]: 20,
  [ProjectRole.VIEWER]: 10,
};
