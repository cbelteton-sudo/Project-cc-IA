import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ContractorsService } from '../src/modules/contractors/contractors.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contractorsService = app.get(ContractorsService);

  const tenantId = 'e754ed05-a958-4b63-baf8-430eb031bc88';
  const projectId = 'b7371d3d-f215-4ece-8cfa-c419996b27bb'; // Or another valid project id

  console.log("Calling create...");
  try {
    const res = await contractorsService.create(tenantId, {
      name: 'Test Contractor Script',
      projectId: projectId
    });
    console.log("Create Result:", res);
  } catch(e) {
    console.error("Error during create:", e);
  }

  await app.close();
}
bootstrap();
