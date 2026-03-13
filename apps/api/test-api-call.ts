import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ContractorsService } from './src/modules/contractors/contractors.service';
import { ProjectsService } from './src/modules/projects/projects.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contService = app.get(ContractorsService);
  const projService = app.get(ProjectsService);
  
  const tenantId = '7836bb4b-ce62-4c28-a1c8-bb0295cb6b5a'; // Using known tenant ID
  const contractorId = 'c6a328db-3d04-43dc-a132-479cb5e2cf23'; // Using known contractor ID
  const projectId = 'b406e22f-d510-41da-a719-79ad2ae3c749'; // Using known project ID
  
  try {
    const res = await contService.getResources(tenantId, contractorId);
    console.log('--- CONTRACTOR RESOURCES ---');
    console.log(JSON.stringify(res, null, 2));

    const projMembers = await projService.getMembers(projectId, tenantId);
    console.log('--- PROJECT MEMBERS ---');
    console.log(JSON.stringify(projMembers, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  await app.close();
}
bootstrap();
