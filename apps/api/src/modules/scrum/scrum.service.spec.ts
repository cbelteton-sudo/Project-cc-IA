import { Test, TestingModule } from '@nestjs/testing';
import { ScrumService } from './scrum.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ScrumService', () => {
  let service: ScrumService;
  let prisma: PrismaService;

  const mockPrismaService = {
    sprint: {
      create: jest.fn(),
      update: jest.fn(),
    },
    sprintItem: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    backlogItem: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    location: {
      update: jest.fn(),
    },
    projectActivity: {
      update: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrumService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ScrumService>(ScrumService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSprint', () => {
    it('should create a sprint with parsed dates', async () => {
      const dto = {
        name: 'Sprint 1',
        projectId: 'p1',
        startDate: '2023-01-01',
        endDate: '2023-01-14',
        createdByUserId: 'u1',
      };
      const expectedResult = {
        id: 's1',
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      };
      mockPrismaService.sprint.create.mockResolvedValue(expectedResult);

      const result = await service.createSprint(dto);
      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.sprint.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        },
      });
    });
  });

  describe('getBacklog', () => {
    it('should return backlog items with children', async () => {
      const projectId = 'p1';
      const expectedItems = [
        {
          id: '1',
          title: 'Story 1',
          type: 'STORY',
          children: [{ id: '2', title: 'Task 1.1', type: 'TASK' }],
        },
      ];

      mockPrismaService.backlogItem.findMany.mockResolvedValue(expectedItems);

      const result = await service.getBacklog(projectId);

      expect(result).toEqual(expectedItems);
      expect(mockPrismaService.backlogItem.findMany).toHaveBeenCalledWith({
        where: { projectId: 'p1' },
        include: {
          assigneeUser: true,
          contractor: true,
          sprintItems: { include: { sprint: true } },
          children: {
            include: {
              assigneeUser: true,
              contractor: true,
              sprintItems: { include: { sprint: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('addItemsToSprint', () => {
    it('should add items to sprint and update their status', async () => {
      const sprintId = 's1';
      const itemIds = ['i1', 'i2'];

      mockPrismaService.sprintItem.upsert.mockResolvedValue({});
      mockPrismaService.backlogItem.updateMany.mockResolvedValue({ count: 2 });
      // Mock $transaction to simply execute the array of promises (simplified for unit test)
      // In reality $transaction takes an array of promises or a function.
      // The service passes an array.
      mockPrismaService.$transaction.mockImplementation(async (ops) => {
        return Promise.all(ops);
      });

      const result = await service.addItemsToSprint(sprintId, itemIds);

      expect(result).toEqual({ success: true });
      expect(mockPrismaService.sprintItem.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.backlogItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: itemIds } },
        data: { status: 'IN_SPRINT' },
      });
    });
  });

  describe('updateSprintItemStatus', () => {
    it('should update item status and sync WBS if DONE', async () => {
      const itemId = 'si1';
      const status = 'DONE';
      const linkedWbsId = 'wbs1';

      const updatedItem = {
        id: itemId,
        boardStatus: status,
        backlogItem: { linkedWbsActivityId: linkedWbsId },
      };

      mockPrismaService.sprintItem.update.mockResolvedValue(updatedItem);
      mockPrismaService.projectActivity.update.mockResolvedValue({});

      const result = await service.updateSprintItemStatus(itemId, status);

      expect(result).toEqual(updatedItem);
      expect(mockPrismaService.sprintItem.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { boardStatus: status },
        include: { backlogItem: true },
      });
      expect(mockPrismaService.projectActivity.update).toHaveBeenCalledWith({
        where: { id: linkedWbsId },
        data: {
          percent: 100,
          status: 'DONE',
          lastUpdateAt: expect.any(Date),
        },
      });
    });
  });
});
