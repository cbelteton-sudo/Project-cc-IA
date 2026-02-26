export enum Permission {
  // Project
  PROJECT_VIEW = 'project.view',
  PROJECT_EDIT = 'project.edit',
  PROJECT_DELETE = 'project.delete',

  // Tasks (Issues/PunchList)
  TASK_VIEW = 'task.view',
  TASK_CREATE = 'task.create',
  TASK_UPDATE = 'task.update',
  TASK_DELETE = 'task.delete',
  TASK_MARK_DONE = 'task.mark_done',
  TASK_APPROVE = 'task.approve',
  TASK_REOPEN = 'task.reopen',

  // RFI
  RFI_VIEW = 'rfi.view',
  RFI_CREATE = 'rfi.create',
  RFI_UPDATE = 'rfi.update',

  // People
  MEMBER_VIEW = 'member.view',
  MEMBER_INVITE = 'member.invite',
  MEMBER_UPDATE = 'member.update',
  OPERATOR_CREATE = 'operator.create', // Create FieldOperator users

  // Financials
  BUDGET_VIEW = 'budget.view',
}

// Map Roles to Permissions
import { ProjectRole } from './roles';

export const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  [ProjectRole.PROJECT_ADMIN]: Object.values(Permission), // All permissions
  [ProjectRole.DIRECTOR]: Object.values(Permission), // Director has all permissions like Admin

  [ProjectRole.PM]: [
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_MARK_DONE,
    Permission.TASK_APPROVE,
    Permission.TASK_REOPEN,
    Permission.RFI_VIEW,
    Permission.RFI_CREATE,
    Permission.RFI_UPDATE,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_UPDATE,
    Permission.OPERATOR_CREATE,
    Permission.BUDGET_VIEW,
  ],

  [ProjectRole.PMO]: [
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_MARK_DONE,
    Permission.TASK_APPROVE,
    Permission.TASK_REOPEN,
    Permission.RFI_VIEW,
    Permission.RFI_CREATE,
    Permission.RFI_UPDATE,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_UPDATE,
    Permission.OPERATOR_CREATE,
    Permission.BUDGET_VIEW,
  ],

  [ProjectRole.FINANCIERO]: [
    Permission.PROJECT_VIEW,
    Permission.MEMBER_VIEW,
    Permission.BUDGET_VIEW,
  ],

  [ProjectRole.EXECUTIVE_VIEWER]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.RFI_VIEW,
    Permission.MEMBER_VIEW,
    Permission.BUDGET_VIEW,
  ],

  [ProjectRole.CONTRACTOR_LEAD]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_MARK_DONE,
    Permission.RFI_VIEW,
    Permission.RFI_CREATE,
    Permission.MEMBER_VIEW, // Can view members? Maybe limited
    Permission.OPERATOR_CREATE, // Can create operators for their contractor
  ],

  [ProjectRole.FIELD_OPERATOR]: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.TASK_MARK_DONE, // Can only mark done
    // Limited creation? Maybe Create Issue
    Permission.TASK_CREATE,
  ],

  [ProjectRole.VIEWER]: [Permission.PROJECT_VIEW],
};
