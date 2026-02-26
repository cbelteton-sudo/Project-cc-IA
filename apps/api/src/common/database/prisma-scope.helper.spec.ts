import { enforceScopeWhere, UserContext } from './prisma-scope.helper';
import { AccessScope } from '../auth/permissions.matrix';

describe('enforceScopeWhere', () => {
  it('without required context (no user/tenantId) => throw explícito', () => {
    // missing user entirely
    expect(() => enforceScopeWhere(null as any)).toThrow(
      'SISTEMA CRÍTICO: Contexto de usuario no definido para query!',
    );

    // missing tenantId
    const userWithoutTenant: UserContext = {
      id: 'user-1',
      tenantId: '',
    };
    expect(() => enforceScopeWhere(userWithoutTenant)).toThrow(
      'SISTEMA CRÍTICO: Contexto de usuario no definido para query!',
    );
  });

  it('with valid tenant context => genera filtro base de tenant', () => {
    const user: UserContext = { id: 'user-1', tenantId: 'tenant-1' };
    const result = enforceScopeWhere(user);

    expect(result).toEqual({ tenantId: 'tenant-1' });
  });

  it('with explicit projectId => fuerza filtro de proyecto directament', () => {
    const user: UserContext = { id: 'user-1', tenantId: 'tenant-1' };
    const result = enforceScopeWhere(user, undefined, 'proj-1');

    expect(result).toEqual({ tenantId: 'tenant-1', projectId: 'proj-1' });
  });

  it('without explicit projectId BUT assigned project scope => fuerza filtro IN array', () => {
    const user: UserContext = {
      id: 'user-1',
      tenantId: 'tenant-1',
      scope: AccessScope.ASSIGNED_PROJECTS,
      assignedProjectIds: ['proj-1', 'proj-2'],
    };
    const result = enforceScopeWhere(user);

    expect(result).toEqual({
      tenantId: 'tenant-1',
      projectId: { in: ['proj-1', 'proj-2'] },
    });
  });

  it('merge con extraWhere sin perder restricciones de seguridad', () => {
    const user: UserContext = { id: 'user-1', tenantId: 'tenant-1' };
    const extraWhere = { status: 'PENDING', title: { contains: 'test' } };

    const result = enforceScopeWhere(user, extraWhere, 'proj-1');

    expect(result).toEqual({
      tenantId: 'tenant-1',
      projectId: 'proj-1',
      status: 'PENDING',
      title: { contains: 'test' },
    });
  });

  it('asegura override de seguridad si extraWhere intenta bypassear tenantId o projectId', () => {
    const user: UserContext = { id: 'user-1', tenantId: 'tenant-1' };
    const maliciousExtraWhere: any = {
      tenantId: 'other-tenant',
      projectId: 'other-proj',
      userId: 'other-user',
    };

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = enforceScopeWhere(user, maliciousExtraWhere, 'safe-proj');

    // El resultado final debe priorizar el TenantId del contexto y projectId de los parámetros
    expect(result.tenantId).toBe('tenant-1');
    expect(result.projectId).toBe('safe-proj');

    // Las llaves sensibles deben haber sido purgadas del where base resultante
    expect(result.userId).toBeUndefined();

    // Se debe arrojar un warning al logger (console.warn en este caso)
    expect(consoleSpy).toHaveBeenCalledWith(
      `[SECURITY WARNING] Intento de inyección de llave sensible 'tenantId' detectado en extraWhere por el usuario user-1 (tenant: tenant-1)`,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      `[SECURITY WARNING] Intento de inyección de llave sensible 'projectId' detectado en extraWhere por el usuario user-1 (tenant: tenant-1)`,
    );

    consoleSpy.mockRestore();
  });
});
