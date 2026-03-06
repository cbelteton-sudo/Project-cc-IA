import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IssuesService } from '../issues/issues.service';
import { FieldReportsService } from '../field-reports/field-reports.service';
import { InspectionsService } from '../inspections/inspections.service';
import { MaterialRequestsService } from '../material-requests/material-requests.service';
import { enforceProjectScopeWhere } from '../../common/database/prisma-scope.helper';
import {
  CreateFieldRecordDto,
  SyncFieldRecordsDto,
  SyncFieldRecordItemDto,
} from './dto/field-record.dto';
import type { CreateMaterialRequestItem } from '../material-requests/dto/create-material-request.dto';
import type { ActiveUserData } from '../../common/interfaces/active-user-data.interface';

@Injectable()
export class FieldRecordsService {
  constructor(
    private prisma: PrismaService,
    private issuesService: IssuesService,
    private fieldReportsService: FieldReportsService,
    private inspectionsService: InspectionsService,
    private materialRequestsService: MaterialRequestsService,
  ) {}

  async createRecord(dto: CreateFieldRecordDto, user: ActiveUserData) {
    const { type, projectId, content } = dto;
    if (!type || !projectId) {
      throw new BadRequestException('type and projectId are required');
    }

    switch (type) {
      case 'ISSUE':
        return this.issuesService.create(
          {
            projectId,
            title: content.title || 'Untitled Issue',
            description: content.description || '',
            severity: content.severity || 'LOW',
            activityId: (content.activityId || content.scheduleActivityId) as
              | string
              | undefined,
          },
          user,
        );
      case 'DAILY_ENTRY': {
        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);

        return this.fieldReportsService.upsertEntry(
          {
            projectId,
            activityName: content.title || 'Reporte General',
            note: content.description || '',
            dateString: todayLocal.toISOString(), // matches getTodayReport EXACT date
            status: content.status || 'ON_TRACK',
            scheduleActivityId: (content.scheduleActivityId ||
              content.activityId) as string | null,
          },
          user,
        );
      }
      case 'INSPECTION':
        return this.inspectionsService.create(
          {
            projectId,
            date: (content.date as string) || new Date().toISOString(),
            type: (content.type as string) || 'Safety',
            notes: (content.notes as string) || '',
            status: (content.status as string) || 'PENDING',
          },
          user,
        );
      case 'MATERIAL_REQUEST':
        return this.materialRequestsService.create(
          {
            projectId,
            title: (content.title as string) || 'Untitled Request',
            items: (content.items as CreateMaterialRequestItem[]) || [],
          },
          user,
        );
      default:
        throw new BadRequestException(
          `Creation for type ${type} is not yet implemented via facade`,
        );
    }
  }

  async syncRecords(dto: SyncFieldRecordsDto, user: ActiveUserData) {
    // Expected structure for sync-draft: { records: [...] } or { items: [...] }
    const items = dto.records || dto.items || [];
    // Just forward to fieldReportsService syncDraft for now. Note that offline payload maps items.
    const syncDto = {
      projectId: dto.projectId || (items[0]?.projectId as string) || '',
      date: dto.date || new Date().toISOString(),
      items: items.map((i: SyncFieldRecordItemDto) => {
        const itemContent = i.content || {};
        return {
          activityId: itemContent.scheduleActivityId || i.activityId,
          status: i.status,
          manualPercent: itemContent.progressChip || i.manualPercent,
          notes: itemContent.note || i.notes,
        };
      }),
    };

    return this.fieldReportsService.syncDraft(syncDto, user);
  }

  async listRecords(
    projectId: string,
    type: string,
    user: ActiveUserData,
    activityId?: string,
  ) {
    if (!projectId) throw new BadRequestException('projectId is required');

    // Verify Access Context
    const project = await this.prisma.project.findFirst({
      where: enforceProjectScopeWhere(user, { id: projectId }, projectId),
    });
    if (!project)
      throw new NotFoundException('Project not found or access denied');

    if (!type || type === 'All') {
      const issues = (await this.listRecords(
        projectId,
        'ISSUE',
        user,
      )) as any[];
      const dailyEntries = (await this.listRecords(
        projectId,
        'DAILY_ENTRY',
        user,
      )) as any[];
      const inspections = (await this.listRecords(
        projectId,
        'INSPECTION',
        user,
      )) as any[];
      const materialRequests = (await this.listRecords(
        projectId,
        'MATERIAL_REQUEST',
        user,
      )) as any[];

      const allRecords = [
        ...issues,
        ...dailyEntries,
        ...inspections,
        ...materialRequests,
      ];
      return allRecords.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    // If type is omitted, we could return diverse records, but usually the frontend explicitly asks for a type.
    switch (type) {
      case 'ISSUE': {
        const issues = await this.issuesService.findAll(projectId, user);
        return issues.map((i) => ({
          id: i.id,
          type: 'ISSUE',
          status: i.status,
          projectId: i.projectId,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
          syncStatus: 'SYNCED', // V1 API spec
          content: {
            title: i.title,
            description: i.description,
            severity: i.severity,
          },
        }));
      }
      case 'DAILY_ENTRY': {
        // Find entries across all reports for this project or just today.
        // For general "list", frontend usually expects today's report
        const report = await this.fieldReportsService.getTodayReport(
          projectId,
          user,
        );
        return (
          report?.entries?.map((e) => ({
            id: e.id,
            type: 'DAILY_ENTRY',
            status: e.status,
            projectId: report.projectId,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
            content: {
              scheduleActivityId: e.scheduleActivityId,
              activityName: e.activityName,
              note: e.note,
              progressChip: e.progressChip,
            },
          })) || []
        );
      }
      case 'DAILY_ENTRY_LOG': {
        if (!activityId)
          throw new BadRequestException(
            'activityId is required for DAILY_ENTRY_LOG',
          );
        const log = await this.fieldReportsService.getActivityLog(
          activityId,
          user,
          projectId,
        );
        return log.map(
          (e: {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            date: Date;
            status: string;
            progressChip: number | null;
            note: string | null;
            createdBy: string | null;
            authorName: string;
            source: string;
            photos: Record<string, unknown>[];
            photosCount: number;
          }) => ({
            id: e.id,
            type: 'DAILY_ENTRY_LOG',
            projectId: projectId,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt || e.createdAt,
            content: {
              date: e.date,
              status: e.status,
              note: e.note,
              authorName: e.authorName,
              source: e.source,
              photos: e.photos,
              photosCount: e.photosCount,
            },
          }),
        );
      }
      case 'INSPECTION': {
        const inspections = await this.inspectionsService.findAll(user);
        const projectInspections = inspections.filter(
          (i: any) => i.projectId === projectId,
        );
        return projectInspections.map((i: any) => ({
          id: i.id,
          type: 'INSPECTION',
          status: i.status || 'PENDING',
          projectId: i.projectId,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
          syncStatus: 'SYNCED',
          content: {
            date: i.date,
            type: i.type,
            notes: i.notes,
          },
        }));
      }
      case 'MATERIAL_REQUEST': {
        const materialRequests = await this.materialRequestsService.findAll(
          projectId,
          user,
        );
        return materialRequests.map((m: any) => ({
          id: m.id,
          type: 'MATERIAL_REQUEST',
          status: m.status || 'DRAFT',
          projectId: m.projectId,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          syncStatus: 'SYNCED',
          content: {
            title: m.title,
            items: typeof m.items === 'string' ? JSON.parse(m.items) : m.items,
          },
        }));
      }
      default:
        return []; // Ignore unknown types for parity
    }
  }

  async getRecord(
    id: string,
    type: string,
    projectId: string,
    user: ActiveUserData,
  ) {
    if (type === 'ISSUE') {
      const issue = await this.prisma.issue.findFirst({
        where: { id, project: enforceProjectScopeWhere(user) },
      });
      if (!issue) throw new NotFoundException();
      return {
        id: issue.id,
        type: 'ISSUE',
        status: issue.status,
        projectId: issue.projectId,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        content: {
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
        },
      };
    }
    if (type === 'INSPECTION') {
      const inspection: any = await this.inspectionsService.findOne(
        id,
        user,
        projectId,
      );
      return {
        id: inspection.id,
        type: 'INSPECTION',
        status: inspection.status || 'PENDING',
        projectId: inspection.projectId,
        createdAt: inspection.createdAt,
        updatedAt: inspection.updatedAt,
        content: {
          date: inspection.date,
          type: inspection.type,
          notes: inspection.notes,
        },
      };
    }
    if (type === 'MATERIAL_REQUEST') {
      const materialRequest: any = await this.materialRequestsService.findOne(
        id,
        projectId,
        user,
      );
      return {
        id: materialRequest.id,
        type: 'MATERIAL_REQUEST',
        status: materialRequest.status || 'DRAFT',
        projectId: materialRequest.projectId,
        createdAt: materialRequest.createdAt,
        updatedAt: materialRequest.updatedAt,
        content: {
          title: materialRequest.title,
          items:
            typeof materialRequest.items === 'string'
              ? JSON.parse(materialRequest.items)
              : materialRequest.items,
        },
      };
    }
    throw new BadRequestException(
      `Get record for type ${type} or without type param is not fully supported in facade`,
    );
  }
}
