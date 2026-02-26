import { Test, TestingModule } from '@nestjs/testing';
import { ScrumController } from './scrum.controller';
import { ScrumService } from './scrum.service';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  projectAuthGuardMock,
  permissionsGuardMock,
} from '../../../test/mocks/authz.mocks';

describe('ScrumController', () => {
  let controller: ScrumController;
  let service: ScrumService;

  const mockScrumService = {
    createSprint: jest.fn(),
    addItemsToSprint: jest.fn(),
    updateSprintItemStatus: jest.fn(),
    getSprintItemContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScrumController],
      providers: [
        {
          provide: ScrumService,
          useValue: mockScrumService,
        },
      ],
    })
      .overrideGuard(ProjectAuthGuard)
      .useValue(projectAuthGuardMock)
      .overrideGuard(PermissionsGuard)
      .useValue(permissionsGuardMock)
      .compile();

    controller = module.get<ScrumController>(ScrumController);
    service = module.get<ScrumService>(ScrumService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSprint', () => {
    it('should call service.createSprint', async () => {
      const dto = {
        name: 'Sprint 1',
        projectId: 'p1',
        startDate: new Date(),
        endDate: new Date(),
      };
      const user = { id: 'u1', email: 'test@example.com' };
      await controller.createSprint(dto, user as any);
      expect(mockScrumService.createSprint).toHaveBeenCalledWith({
        ...dto,
        createdByUserId: user.id,
      });
    });
  });

  describe('addItemsToSprint', () => {
    it('should call service.addItemsToSprint', async () => {
      const sprintId = 's1';
      const items = ['i1', 'i2'];
      await controller.addItemsToSprint(sprintId, { items });
      expect(mockScrumService.addItemsToSprint).toHaveBeenCalledWith(
        sprintId,
        items,
      );
    });
  });

  describe('updateItemStatus', () => {
    it('should call service.updateSprintItemStatus', async () => {
      const itemId = 'i1';
      const status = 'DONE';
      const user = { id: 'u1', email: 'test@example.com' };
      mockScrumService.getSprintItemContext.mockResolvedValue({
        member: { role: 'PROJECT_MANAGER' },
      });
      await controller.updateItemStatus(itemId, { status }, user as any);
      expect(mockScrumService.updateSprintItemStatus).toHaveBeenCalledWith(
        itemId,
        status,
      );
    });
  });
});
