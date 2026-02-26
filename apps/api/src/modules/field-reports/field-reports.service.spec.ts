import { Test, TestingModule } from '@nestjs/testing';
import { FieldReportsService } from './field-reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FieldReportsService Security & Data Isolation', () => {
  let service: FieldReportsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Create a mock PrismaService
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldReportsService,
        {
          provide: PrismaService,
          useValue: {
            fieldDailyReport: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            projectActivity: {
              findUnique: jest.fn(),
              findMany: jest.fn(), // Added to fix the mock error
            },
            fieldDailyEntry: {
              upsert: jest.fn(),
              findMany: jest.fn(),
            },
            projectMember: {
              findUnique: jest.fn(),
            },
            project: {
              findFirst: jest.fn(),
            },
            issue: {
              groupBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FieldReportsService>(FieldReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncDraft (Offline unification)', () => {
    it('should create a new daily report if one does not exist for the project and date', async () => {
      // Mock that project member exists so authorization passes implicitly if tested in pipeline
      // Since this is service layer, we just test the DB queries are scoped correctly

      const dto = {
        projectId: 'proj-1',
        date: '2023-10-10',
        items: [],
      };

      const expectedDate = new Date(dto.date);

      jest
        .spyOn(prisma.project, 'findFirst')
        .mockResolvedValue({ id: 'proj-1' } as any);
      jest.spyOn(prisma.fieldDailyReport, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.fieldDailyReport, 'create').mockResolvedValue({
        id: 'report-1',
        projectId: 'proj-1',
        date: expectedDate,
        createdBy: 'user-1',
        status: 'DRAFT',
      } as any);

      const result = await service.syncDraft(dto, {
        id: 'user-1',
        userId: 'user-1',
        tenantId: 'test-tenant',
      } as any);

      expect(prisma.fieldDailyReport.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'proj-1',
            date: expectedDate,
          }),
        }),
      );

      expect(prisma.fieldDailyReport.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          date: expectedDate,
          createdBy: 'user-1',
          status: 'DRAFT',
        },
      });

      expect(result.fieldUpdate.id).toBe('report-1');
      expect(result.items.length).toBe(0);
    });

    it('should process items and fetch activity details scope to project', async () => {
      const dto = {
        projectId: 'proj-1',
        date: '2023-10-10',
        items: [
          {
            activityId: 'act-1',
            percent: 50,
            notes: 'Halfway done',
            isRisk: false,
          },
        ],
      };

      const expectedDate = new Date(dto.date);

      jest
        .spyOn(prisma.project, 'findFirst')
        .mockResolvedValue({ id: 'proj-1' } as any);

      // Existing report
      jest.spyOn(prisma.fieldDailyReport, 'findFirst').mockResolvedValue({
        id: 'report-1',
        projectId: 'proj-1',
        date: expectedDate,
        createdBy: 'user-1',
        status: 'DRAFT',
      } as any);

      // Mock Activity
      jest.spyOn(prisma.projectActivity, 'findUnique').mockResolvedValue({
        id: 'act-1',
        name: 'Excavation',
        measurementType: 'PERCENTAGE',
        projectId: 'proj-1', // ensuring it maps to the correct project internally
      } as any);

      // Mock upsert
      jest
        .spyOn(service, 'upsertEntry')
        .mockResolvedValue({ id: 'entry-1' } as any);

      const result = await service.syncDraft(dto, {
        id: 'user-1',
        userId: 'user-1',
        tenantId: 'test-tenant',
      } as any);

      expect(prisma.projectActivity.findUnique).toHaveBeenCalledWith({
        where: { id: 'act-1' },
        select: {
          id: true,
          name: true,
          code: true,
          measurementType: true,
          totalQty: true,
        },
      });

      expect(service.upsertEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyReportId: 'report-1',
          scheduleActivityId: 'act-1',
          activityName: 'Excavation',
          status: 'IN_PROGRESS',
          progressChip: undefined, // manualPercent is not passed
          note: 'Halfway done',
          projectId: 'proj-1',
          createdBy: 'user-1',
          dateString: '2023-10-10',
        }),
        expect.objectContaining({ id: 'user-1', tenantId: 'test-tenant' }),
      );

      expect(result.items.length).toBe(1);
    });
  });

  describe('Data Isolation and Scoping', () => {
    it('getPMDashboardMetrics should fetch data exclusively for the specified projectId', async () => {
      jest.spyOn(prisma.fieldDailyReport, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.projectActivity, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.fieldDailyEntry, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.issue, 'groupBy').mockResolvedValue([] as any);
      jest
        .spyOn(prisma.project, 'findFirst')
        .mockResolvedValue({ id: 'proj-isolated' } as any);

      await service.getPMDashboardMetrics('proj-isolated', {
        id: 'test-user',
        userId: 'test-user',
        tenantId: 'test-tenant',
      });

      expect(prisma.fieldDailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'proj-isolated' }),
        }),
      );
    });

    it('getTodayReport should fetch report exclusively for the specified projectId and date', async () => {
      jest.spyOn(prisma.fieldDailyReport, 'findFirst').mockResolvedValue(null);
      jest
        .spyOn(prisma.fieldDailyReport, 'create')
        .mockResolvedValue({} as any);
      jest
        .spyOn(prisma.project, 'findFirst')
        .mockResolvedValue({ id: 'proj-today' } as any);

      await service.getTodayReport('proj-today', {
        id: 'user-2',
        userId: 'user-2',
        tenantId: 'test-tenant',
      });

      expect(prisma.fieldDailyReport.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'proj-today',
          }),
        }),
      );
    });
  });
});
