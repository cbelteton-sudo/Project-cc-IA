import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Scrum Flow (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockPrismaService = {
    sprint: {
      create: jest.fn(),
      update: jest.fn(),
    },
    sprintItem: {
      upsert: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    backlogItem: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    projectActivity: {
      update: jest.fn(),
    },
    $transaction: jest.fn((ops) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      // If it's a function (interactive transaction), call it with this mockPrismaService
      if (typeof ops === 'function') return ops(mockPrismaService);
      return Promise.resolve(ops);
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('/scrum/sprints (POST) - Create Sprint', () => {
    const createSprintDto = {
      name: 'Sprint 1',
      projectId: 'p1',
      startDate: '2023-01-01',
      endDate: '2023-01-14',
    };

    mockPrismaService.sprint.create.mockResolvedValue({
      id: 's1',
      ...createSprintDto,
      startDate: new Date(createSprintDto.startDate),
      endDate: new Date(createSprintDto.endDate),
    });

    return request(app.getHttpServer())
      .post('/scrum/sprints')
      .send(createSprintDto)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toEqual('s1');
        expect(mockPrismaService.sprint.create).toHaveBeenCalled();
      });
  });

  it('/scrum/sprints/:sprintId/items (POST) - Add Items to Sprint', () => {
    const sprintId = 's1';
    const items = ['i1', 'i2'];

    mockPrismaService.sprintItem.upsert.mockResolvedValue({});
    mockPrismaService.backlogItem.updateMany.mockResolvedValue({ count: 2 });
    mockPrismaService.$transaction.mockImplementation(async (ops) => {
      return Promise.all(ops);
    });

    return request(app.getHttpServer())
      .post(`/scrum/sprints/${sprintId}/items`)
      .send({ items })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(mockPrismaService.sprintItem.upsert).toHaveBeenCalledTimes(2);
      });
  });

  it('/scrum/items/:itemId/status (PATCH) - Move Item in Kanban', () => {
    const itemId = 'si1';
    const status = 'DONE';

    mockPrismaService.sprintItem.update.mockResolvedValue({
      id: itemId,
      boardStatus: status,
      backlogItem: { linkedWbsActivityId: 'wbs1' },
    });
    mockPrismaService.projectActivity.update.mockResolvedValue({});

    return request(app.getHttpServer())
      .patch(`/scrum/items/${itemId}/status`)
      .send({ status })
      .expect(200)
      .expect((res) => {
        expect(res.body.boardStatus).toEqual('DONE');
        expect(mockPrismaService.sprintItem.update).toHaveBeenCalled();
        expect(mockPrismaService.projectActivity.update).toHaveBeenCalled();
      });
  });
});
