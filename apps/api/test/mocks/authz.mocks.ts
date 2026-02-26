import { ProjectAuthGuard } from '../../src/common/guards/project-auth.guard';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';

export const prismaMock = {
  projectMember: { findFirst: jest.fn() },
  session: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: { findUnique: jest.fn() },
  contractor: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

export const projectAuthGuardMock = {
  canActivate: jest.fn(() => true),
};

export const permissionsGuardMock = {
  canActivate: jest.fn(() => true),
};
