import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCommentDto,
  CommentReferenceType,
} from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(createCommentDto: CreateCommentDto, user: any) {
    const { text, referenceType, referenceId, projectId, mentionedUserIds } =
      createCommentDto;

    // Check entity exists
    if (referenceType === CommentReferenceType.PROJECT) {
      await this.verifyExists('project', referenceId);
    } else if (referenceType === CommentReferenceType.ACTIVITY) {
      await this.verifyExists('projectActivity', referenceId);
    } else if (referenceType === CommentReferenceType.MATERIAL) {
      await this.verifyExists('material', referenceId);
    } else if (referenceType === CommentReferenceType.ISSUE) {
      await this.verifyExists('issue', referenceId);
    }

    const commentData: any = {
      text,
      createdBy: user.userId,
    };

    if (referenceType === CommentReferenceType.PROJECT)
      commentData.projectId = referenceId;
    if (referenceType === CommentReferenceType.ACTIVITY)
      commentData.activityId = referenceId;
    if (referenceType === CommentReferenceType.MATERIAL)
      commentData.materialId = referenceId;
    if (referenceType === CommentReferenceType.ISSUE)
      commentData.issueId = referenceId;

    const comment = await this.prisma.comment.create({
      data: commentData,
    });

    let usersToNotify: any[] = [];

    // Attempt to notify users by explicit IDs provided in the DTO
    if (mentionedUserIds && mentionedUserIds.length > 0) {
      usersToNotify = await this.prisma.user.findMany({
        where: { id: { in: mentionedUserIds } },
      });
    }

    // Fallback: Parse @mentions from text if no explicit IDs were provided
    if (usersToNotify.length === 0) {
      const mentionRegex = /@([\w.-]+)/g;
      const mentions = [...text.matchAll(mentionRegex)].map((m) => m[1]);

      if (mentions.length > 0) {
        usersToNotify = await this.prisma.user.findMany({
          where: { username: { in: mentions } },
        });
      }
    }

    if (usersToNotify.length > 0) {
      // Create a notification for each mentioned user
      const notificationsPromises = usersToNotify
        .filter((mu) => mu.id !== user.userId)
        .map((mu) => {
          const authorName = user.name || user.username || 'Un usuario';
          const previewText = text.length > 50 ? `${text.substring(0, 50)}...` : text;
          return this.notifications.create(
            mu.id,
            'MENTION',
            referenceType,
            referenceId,
            `${authorName} te mencionó: "${previewText}"`,
            projectId,
          );
        });

      await Promise.all(notificationsPromises);
    }

    return comment;
  }

  async findAll(referenceType: CommentReferenceType, referenceId: string) {
    const whereClause: any = {};
    if (referenceType === CommentReferenceType.PROJECT)
      whereClause.projectId = referenceId;
    else if (referenceType === CommentReferenceType.ACTIVITY)
      whereClause.activityId = referenceId;
    else if (referenceType === CommentReferenceType.MATERIAL)
      whereClause.materialId = referenceId;
    else if (referenceType === CommentReferenceType.ISSUE)
      whereClause.issueId = referenceId;
    else return []; // Empty if not matched

    return this.prisma.comment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, user: any) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Only creator or admin can delete (simplified RBAC here, customize as needed)
    if (comment.createdBy !== user.userId && user.role !== 'platform_admin') {
      throw new UnauthorizedException('You can only delete your own comments.');
    }

    return this.prisma.comment.delete({ where: { id } });
  }

  private async verifyExists(model: string, id: string) {
    // @ts-expect-error - dynamic model calling on PrismaClient
    const entity = await this.prisma[model].findUnique({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`${model} with ID ${id} not found`);
    }
    return entity;
  }
}
