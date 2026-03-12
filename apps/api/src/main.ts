import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpAdapterHost } from '@nestjs/core';
import * as http from 'http';

declare const module: any; // Webpack HMR

const BOOT_KEY = '__fieldclose_api_booted__';

import { urlencoded, json } from 'express';

async function bootstrap() {
  // 1. Global Guard: Prevent double-bootstrap in same process
  if ((globalThis as any)[BOOT_KEY]) {
    console.warn('⚠️ [API] Bootstrap called but already booted! Ignoring.');
    return;
  }
  (globalThis as any)[BOOT_KEY] = true;

  const port = Number(process.env.PORT ?? 3000);

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Increase JSON payload limits for base64 photo uploads
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    // 2. Enable Shutdown Hooks (SIGTERM/SIGINT)
    app.enableShutdownHooks();

    app.setGlobalPrefix('api');

    // Phase 0: Security & Hardening

    const cookieParser = require('cookie-parser');
    app.use(cookieParser());

    app.use((req: any, res: any, next: any) => {
      const start = Date.now();
      res.on('finish', () => {
        if (req.url.includes('/members') || req.url.includes('/resources')) {
          console.log(
            `[DEBUG_API] ${req.method} ${req.url} ${res.statusCode} - ${Date.now() - start}ms`,
          );
        }
      });
      next();
    });

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ];
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    app.enableCors({
      origin: allowedOrigins,
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
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    // Add a root route for health checks (bypassing global prefix) to satisfy Railway defaults
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('/', (_req: any, res: any) => res.send('OK'));
    expressApp.get('/health', (_req: any, res: any) => res.send('OK'));

    // Trigger restart 9
    await app.listen(port, '0.0.0.0');
    console.log(`[API] listening on ${port} pid=${process.pid}`);

    // 3. HMR / Hot Reload Clean Shutdown
    if (module.hot) {
      module.hot.accept();
      module.hot.dispose(() => app.close());
    }
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ [FATAL] Port ${port} is already in use!`);
      console.error(
        'You likely have another instance of the API running in another terminal.',
      );
      console.error(
        'Please close all other "npm run start:dev" or "nest start" processes.',
      );
      process.exit(1);
    }
    console.error(
      '❌ NestJS Bootstrap Failed! Starting fallback server...',
      error,
    );

    // Emergency Fallback Server
    // Keeps the container alive so we can see logs and debugging info
    // Emergency Fallback Server
    // Keeps the container alive so we can see logs and debugging info
    // const http = require('http');
    const server = http.createServer((req: any, res: any) => {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify(
          {
            status: 'error',
            message: 'Application failed to start',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          null,
          2,
        ),
      );
    });

    server.listen(port, () => {
      console.log(`⚠️ Fallback server listening on port ${port}`);
    });
  }
}
bootstrap().catch((err) => {
  console.error('Unhandled bootstrap error:', err);
  process.exit(1);
});
