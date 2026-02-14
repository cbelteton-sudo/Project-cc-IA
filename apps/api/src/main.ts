import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpAdapterHost } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Serve static files from uploads directory
  // Assuming uploads is in the root of apps/api
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 4180;

  // Add a root route for health checks (bypassing global prefix) to satisfy Railway defaults
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (_req: any, res: any) => res.send('OK'));
  expressApp.get('/health', (_req: any, res: any) => res.send('OK'));

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
