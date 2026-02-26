import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ProjectAuthGuard } from './project-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProjectAuthGuard', () => {
  let guard: ProjectAuthGuard;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      projectMember: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;
    guard = new ProjectAuthGuard(prisma);
  });

  function createMockContext(requestArgs: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => requestArgs,
      }),
    } as unknown as ExecutionContext;
  }

  it('debería retornar false si no hay usuario en el request', async () => {
    const context = createMockContext({});
    const result = await guard.canActivate(context);
    expect(result).toBe(false);
  });

  describe('Extracción de projectId', () => {
    it('Lanza ForbiddenException si no hay projectId en params ni query', async () => {
      const context = createMockContext({
        user: { id: 'user-1' },
        params: {},
        query: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Project Context Required',
      );
    });

    it('Extrae projectId de params.id', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        status: 'ACTIVE',
      } as any);
      const context = createMockContext({
        user: { id: 'user-1' },
        params: { id: 'proj-params-id' },
        query: {},
      });

      await guard.canActivate(context);
      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: { projectId: 'proj-params-id', userId: 'user-1' },
        },
        include: { contractor: true, project: true },
      });
    });

    it('Extrae projectId de params.projectId', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        status: 'ACTIVE',
      } as any);
      const context = createMockContext({
        user: { id: 'user-1' },
        params: { projectId: 'proj-params-projectId' },
        query: {},
      });

      await guard.canActivate(context);
      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId: 'proj-params-projectId',
            userId: 'user-1',
          },
        },
        include: { contractor: true, project: true },
      });
    });

    it('Extrae projectId de query.projectId', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        status: 'ACTIVE',
      } as any);
      const context = createMockContext({
        user: { id: 'user-1' },
        params: {},
        query: { projectId: 'proj-query' },
      });

      await guard.canActivate(context);
      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: { projectId: 'proj-query', userId: 'user-1' },
        },
        include: { contractor: true, project: true },
      });
    });
  });

  describe('Validación de Membresía', () => {
    it('MEMBRESÍA ACTIVE => permite y adjunta request.projectMember', async () => {
      const mockMember = { id: 'mem-1', status: 'ACTIVE', role: 'PM' };
      prisma.projectMember.findUnique.mockResolvedValue(mockMember as any);

      const request = {
        user: { id: 'user-1' },
        params: { id: 'proj-1' },
        query: {},
        projectMember: undefined,
      };
      const context = createMockContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.projectMember).toEqual(mockMember);
    });

    it('MEMBRESÍA INEXISTENTE => 403 Forbidden', async () => {
      prisma.projectMember.findUnique.mockResolvedValue(null);

      const context = createMockContext({
        user: { id: 'user-1' },
        params: { id: 'proj-1' },
        query: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Access to this project is denied',
      );
    });

    it('MEMBRESÍA DISABLED o NO ACTIVE => 403 Forbidden', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        status: 'INACTIVE',
      } as any);

      const context = createMockContext({
        user: { id: 'user-1' },
        params: { id: 'proj-1' },
        query: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
