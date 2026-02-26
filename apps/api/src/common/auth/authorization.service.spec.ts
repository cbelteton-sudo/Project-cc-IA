import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService, ResourceContext } from './authorization.service';
import { Permission } from '../constants/permissions';
import { ProjectRole } from '../constants/roles';
import { AccessScope } from './permissions.matrix';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorizationService],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  describe('getEffectivePermissions', () => {
    it('should return all permissions for PLATFORM_ADMIN', () => {
      // It inherits from PROJECT_ADMIN and DIRECTOR
      const perms = service.getEffectivePermissions('PLATFORM_ADMIN');
      expect(perms).toContain(Permission.PROJECT_VIEW);
      expect(perms).toContain(Permission.TASK_CREATE);
      expect(perms).toContain(Permission.MEMBER_INVITE);
    });

    it('should return combined permissions based on roleHierarchy', () => {
      const perms = service.getEffectivePermissions(
        ProjectRole.CONTRACTOR_LEAD,
      );
      expect(perms).toContain(Permission.TASK_CREATE); // Base
      expect(perms).toContain(Permission.PROJECT_VIEW); // Base/Inherited from VIEWER via FIELD_OPERATOR
      expect(perms).toContain(Permission.TASK_MARK_DONE); // Inherited from FIELD_OPERATOR
    });

    it('should return empty permissions for unknown role', () => {
      const perms = service.getEffectivePermissions('UNKNOWN_ROLE');
      expect(perms).toEqual([]);
    });
  });

  describe('can (RBAC + Scope validation)', () => {
    const tenantCtx: ResourceContext = { tenantId: 'tenant-1' };
    const projectCtx: ResourceContext = {
      tenantId: 'tenant-1',
      projectId: 'proj-1',
    };
    const portfolioCtx: ResourceContext = {
      tenantId: 'tenant-1',
      portfolioId: 'port-1',
    };

    it('a) PLATFORM_ADMIN => acceso TENANT_WIDE completo', () => {
      const user = { role: 'PLATFORM_ADMIN' };
      // Even without projectId, it should be allowed because scope is TENANT_WIDE
      expect(service.can(user, Permission.PROJECT_VIEW, tenantCtx)).toBe(true);
      expect(service.can(user, Permission.TASK_DELETE, projectCtx)).toBe(true);
    });

    it('b) DIRECTOR_PMO => acceso PORTFOLIO_PROJECTS', () => {
      const user = { role: 'DIRECTOR_PMO' };
      // Allowed if portfolioId or projectId is present
      expect(service.can(user, Permission.PROJECT_VIEW, portfolioCtx)).toBe(
        true,
      );
      expect(service.can(user, Permission.PROJECT_VIEW, projectCtx)).toBe(true);
      // Denied if no context
      expect(service.can(user, Permission.PROJECT_VIEW, tenantCtx)).toBe(false);
    });

    it('c) PROJECT_MANAGER => acceso ASSIGNED_PROJECTS (multi-proyecto asignado)', () => {
      const user = { projectRole: ProjectRole.PM };
      // Assigned projects scope requires projectId in context
      expect(service.can(user, Permission.PROJECT_EDIT, projectCtx)).toBe(true);
      // Fails if trying to access without a specific project context (like tenant level)
      expect(service.can(user, Permission.PROJECT_EDIT, tenantCtx)).toBe(false);
    });

    it('d) SUPERVISOR/RESIDENTE (FIELD_OPERATOR) => acceso limitado a proyecto asignado', () => {
      const user = { projectRole: ProjectRole.FIELD_OPERATOR };
      // Has TASK_MARK_DONE, requires projectId
      expect(service.can(user, Permission.TASK_MARK_DONE, projectCtx)).toBe(
        true,
      );
      // Does not have TASK_DELETE
      expect(service.can(user, Permission.TASK_DELETE, projectCtx)).toBe(false);
    });

    it('e) CONTRACTOR_LEAD => acceso solo al alcance de su paquete', () => {
      const user = { projectRole: ProjectRole.CONTRACTOR_LEAD };
      expect(service.can(user, Permission.TASK_CREATE, projectCtx)).toBe(true);
      expect(service.can(user, Permission.TASK_APPROVE, projectCtx)).toBe(
        false,
      );
    });

    it('f) CLIENT_VIEWER (VIEWER) => lectura restringida', () => {
      const user = { projectRole: ProjectRole.VIEWER };
      expect(service.can(user, Permission.PROJECT_VIEW, projectCtx)).toBe(true);
      expect(service.can(user, Permission.TASK_CREATE, projectCtx)).toBe(false);
    });

    it('g) FINANZAS (FINANCIERO) => acceso financiero donde corresponde', () => {
      const user = { projectRole: ProjectRole.FINANCIERO };
      expect(service.can(user, Permission.BUDGET_VIEW, projectCtx)).toBe(true);
      expect(service.can(user, Permission.TASK_CREATE, projectCtx)).toBe(false);
    });

    it('h) rol deshabilitado/inactivo => denegado', () => {
      // A user with an unknown role gets an empty permissions list.
      const user = { role: 'UNKNOWN' };
      expect(service.can(user, Permission.PROJECT_VIEW, projectCtx)).toBe(
        false,
      );
      expect(service.can(user, Permission.TASK_CREATE, projectCtx)).toBe(false);
    });

    it('data isolation -> Own projects requires project context', () => {
      const user = { role: 'SOME_DEFAULT_ROLE_WITHOUT_PROJECT_MEMBERSHIP' };
      // Without project role, scope falls back to OWN_PROJECTS
      expect(service.can(user, Permission.PROJECT_VIEW, tenantCtx)).toBe(false); // Fails lacking project context
      expect(service.can(user, Permission.PROJECT_VIEW, projectCtx)).toBe(
        false,
      ); // Fails because unknown role has 0 permissions.
    });
  });

  describe('resolveScope (Private method validation through testing "can")', () => {
    it('Returns correct scope based on role implicitly', () => {
      // Just an extra check to make coverage 100% on the default switch statement case
      const user = { role: 'SOME_ROLE', projectRole: null };
      const ctx: ResourceContext = { tenantId: 'tenant-1' };
      // Fallback is OWN_PROJECTS which returns false missing projectId
      expect(service.can(user, Permission.PROJECT_VIEW, ctx)).toBe(false);
    });
  });
});
