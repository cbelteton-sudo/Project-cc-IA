import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService, ResourceContext } from './authorization.service';
import { PermissionRepository } from './repositories/permission.repository';
import { Permission } from '../constants/permissions';
import { ProjectRole } from '../constants/roles';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let mockPermissionRepo: any;

  beforeEach(async () => {
    mockPermissionRepo = {
      getEffectivePermissionsForRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        {
          provide: PermissionRepository,
          useValue: mockPermissionRepo,
        },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
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

    it('a) PLATFORM_ADMIN => acceso TENANT_WIDE completo', async () => {
      const user = { role: 'PLATFORM_ADMIN' };
      mockPermissionRepo.getEffectivePermissionsForRole.mockResolvedValue([
        Permission.PROJECT_VIEW,
        Permission.TASK_DELETE,
      ]);

      // Even without projectId, it should be allowed because scope is TENANT_WIDE
      expect(await service.can(user, Permission.PROJECT_VIEW, tenantCtx)).toBe(
        true,
      );
      expect(await service.can(user, Permission.TASK_DELETE, projectCtx)).toBe(
        true,
      );
    });

    it('b) DIRECTOR_PMO => acceso PORTFOLIO_PROJECTS', async () => {
      const user = { role: 'DIRECTOR_PMO' };
      mockPermissionRepo.getEffectivePermissionsForRole.mockResolvedValue([
        Permission.PROJECT_VIEW,
      ]);

      // Allowed if portfolioId or projectId is present
      expect(
        await service.can(user, Permission.PROJECT_VIEW, portfolioCtx),
      ).toBe(true);
      expect(await service.can(user, Permission.PROJECT_VIEW, projectCtx)).toBe(
        true,
      );
      // Denied if no context
      expect(await service.can(user, Permission.PROJECT_VIEW, tenantCtx)).toBe(
        false,
      );
    });

    it('c) PROJECT_MANAGER => acceso ASSIGNED_PROJECTS', async () => {
      const user = { projectRole: ProjectRole.PM };
      mockPermissionRepo.getEffectivePermissionsForRole.mockResolvedValue([
        Permission.PROJECT_EDIT,
      ]);

      // Assigned projects scope requires projectId in context
      expect(await service.can(user, Permission.PROJECT_EDIT, projectCtx)).toBe(
        true,
      );
      // Fails if trying to access without a specific project context (like tenant level)
      expect(await service.can(user, Permission.PROJECT_EDIT, tenantCtx)).toBe(
        false,
      );
    });

    it('d) SUPERVISOR/RESIDENTE (FIELD_OPERATOR) => acceso limitado a proyecto asignado', async () => {
      const user = { projectRole: ProjectRole.FIELD_OPERATOR };
      // Tiene MARK_DONE pero no TASK_DELETE
      mockPermissionRepo.getEffectivePermissionsForRole.mockResolvedValue([
        Permission.TASK_MARK_DONE,
      ]);

      expect(
        await service.can(user, Permission.TASK_MARK_DONE, projectCtx),
      ).toBe(true);
      expect(await service.can(user, Permission.TASK_DELETE, projectCtx)).toBe(
        false,
      );
    });

    it('e) CONTRACTOR_LEAD => acceso solo al alcance de su paquete', async () => {
      const user = { projectRole: ProjectRole.CONTRACTOR_LEAD };
      mockPermissionRepo.getEffectivePermissionsForRole.mockResolvedValue([
        Permission.TASK_CREATE,
      ]);

      expect(await service.can(user, Permission.TASK_CREATE, projectCtx)).toBe(
        true,
      );
      expect(await service.can(user, Permission.TASK_APPROVE, projectCtx)).toBe(
        false,
      );
    });

    it('f) CLIENT_VIEWER (VIEWER) => lectura restringida', async () => {
      const user = { projectRole: ProjectRole.VIEWER };
      mockPermissionRepo.getEffectivePermissionsForRole.mockResolvedValue([
        Permission.PROJECT_VIEW,
      ]);

      expect(await service.can(user, Permission.PROJECT_VIEW, projectCtx)).toBe(
        true,
      );
      expect(await service.can(user, Permission.TASK_CREATE, projectCtx)).toBe(
        false,
      );
    });

    it('g) FINANZAS (FINANCIERO) => acceso financiero donde corresponde', async () => {
      const user = { projectRole: ProjectRole.FINANCIERO };
      mockPermissionRepo.getEffectivePermissionsForRole.mockResolvedValue([
        Permission.BUDGET_VIEW,
      ]);

      expect(await service.can(user, Permission.BUDGET_VIEW, projectCtx)).toBe(
        true,
      );
      expect(await service.can(user, Permission.TASK_CREATE, projectCtx)).toBe(
        false,
      );
    });

    it('h) rol deshabilitado/inactivo => denegado', async () => {
      const user = { role: 'UNKNOWN' };
      mockPermissionRepo.getEffectivePermissionsForRole.mockResolvedValue([]);
      expect(await service.can(user, Permission.PROJECT_VIEW, projectCtx)).toBe(
        false,
      );
    });

    it('data isolation -> Own projects requires project context', async () => {
      const user = { role: 'SOME_DEFAULT_ROLE_WITHOUT_PROJECT_MEMBERSHIP' };
      mockPermissionRepo.getEffectivePermissionsForRole.mockResolvedValue([
        Permission.PROJECT_VIEW,
      ]);
      // Without project role, scope falls back to OWN_PROJECTS WHICH requires project context
      expect(await service.can(user, Permission.PROJECT_VIEW, tenantCtx)).toBe(
        false,
      ); // Fails lacking project context
      // Si tiene contexto sí falla porque tiene el permiso
      expect(await service.can(user, Permission.PROJECT_VIEW, projectCtx)).toBe(
        true,
      );
    });
  });
});
