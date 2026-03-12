import { Module } from '@nestjs/common';
import { ProjectMaterialsService } from './project-materials.service';
import { ProjectMaterialsController } from './project-materials.controller';

@Module({
  providers: [ProjectMaterialsService],
  controllers: [ProjectMaterialsController],
})
export class ProjectMaterialsModule {}
