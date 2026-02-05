import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController, MilestonesController],
  providers: [ProjectsService, MilestonesService],
})
export class ProjectsModule { }
