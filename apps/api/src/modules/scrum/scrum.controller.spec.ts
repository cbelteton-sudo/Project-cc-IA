import { Test, TestingModule } from '@nestjs/testing';
import { ScrumController } from './scrum.controller';
import { ScrumService } from './scrum.service';

describe('ScrumController', () => {
  let controller: ScrumController;
  let service: ScrumService;

  const mockScrumService = {
    createSprint: jest.fn(),
    addItemsToSprint: jest.fn(),
    updateSprintItemStatus: jest.fn(),
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
    }).compile();

    controller = module.get<ScrumController>(ScrumController);
    service = module.get<ScrumService>(ScrumService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSprint', () => {
    it('should call service.createSprint', async () => {
      const dto = { name: 'Sprint 1' };
      await controller.createSprint(dto);
      expect(mockScrumService.createSprint).toHaveBeenCalledWith(dto);
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
      await controller.updateItemStatus(itemId, { status });
      expect(mockScrumService.updateSprintItemStatus).toHaveBeenCalledWith(
        itemId,
        status,
      );
    });
  });
});
