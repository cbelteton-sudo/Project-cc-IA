import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import {
  CreateCommentDto,
  CommentReferenceType,
} from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveUser } from '../../common/decorators/active-user.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @ActiveUser() user: any) {
    return this.commentsService.create(createCommentDto, user);
  }

  @Get()
  findAll(
    @Query('referenceType') referenceType: CommentReferenceType,
    @Query('referenceId') referenceId: string,
  ) {
    return this.commentsService.findAll(referenceType, referenceId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: any) {
    return this.commentsService.remove(id, user); // Needs permission check conceptually
  }
}
