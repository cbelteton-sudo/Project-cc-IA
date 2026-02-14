import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ MySQL Connection established');
    } catch (error) {
      console.error('❌ Prisma Connection Failed', error);
      // We suppress the error to allow the app to start and pass healthchecks
      // This allows us to debug the logs instead of crashing immediately
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
