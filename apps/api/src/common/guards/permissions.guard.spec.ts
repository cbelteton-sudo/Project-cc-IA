import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { Permission } from '../constants/permissions';
import { ProjectRole } from '../constants/roles';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new PermissionsGuard(reflector);
  });

  function createMockContext(requestArgs: any = {}): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => requestArgs,
      }),
    } as unknown as ExecutionContext;
  }

  it('ausencia de metadata de permisos => comportamiento esperado (allow)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(false); // intentional CI gate failure
  });

  it('request sin projectMember => denegado (ForbiddenException)', () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.PROJECT_VIEW]);
    const context = createMockContext({}); // No projectMember

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Project membership context missing. Ensure ProjectAuthGuard is used.',
    );
  });

  it('endpoint con @RequirePermissions(single) permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.TASK_CREATE]);
    const context = createMockContext({
      projectMember: { role: ProjectRole.PM },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('endpoint con @RequirePermissions(single) denegado', () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.TASK_CREATE]);
    const context = createMockContext({
      projectMember: { role: ProjectRole.VIEWER },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Insufficient Permissions: Required task.create',
    );
  });

  it('endpoint con múltiples permisos (allOf) permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([
      Permission.TASK_CREATE,
      Permission.TASK_UPDATE,
    ]);
    const context = createMockContext({
      projectMember: { role: ProjectRole.PM },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('endpoint con múltiples permisos (allOf) denegado parcial', () => {
    reflector.getAllAndOverride.mockReturnValue([
      Permission.TASK_VIEW,
      Permission.TASK_APPROVE,
    ]);
    const context = createMockContext({
      projectMember: { role: ProjectRole.FIELD_OPERATOR }, // Only has TASK_VIEW, not APPROVE
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('Unknown role fallback fail', () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.PROJECT_VIEW]);
    const context = createMockContext({
      projectMember: { role: 'SOME_HACKER_ROLE' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Invalid Role Configuration',
    );
  });
});
