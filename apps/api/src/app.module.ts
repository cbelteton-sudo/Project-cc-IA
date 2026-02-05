import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ChangeOrdersModule } from './modules/change-orders/change-orders.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { MaterialRequestsModule } from './modules/material-requests/material-requests.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { RfqsModule } from './modules/rfqs/rfqs.module';
import { ProgressEstimatesModule } from './modules/progress-estimates/progress-estimates.module';
import { SubcontractsModule } from './modules/subcontracts/subcontracts.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { RfisModule } from './modules/rfis/rfis.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ContractorsModule } from './modules/contractors/contractors.module';
import { ActivitiesModule } from './modules/activities/activities.module';

@Module({
  imports: [TenantsModule, UsersModule, AuthModule, ProjectsModule, BudgetsModule, ChangeOrdersModule, MaterialsModule, MaterialRequestsModule, PurchaseOrdersModule, RfqsModule, ProgressEstimatesModule, SubcontractsModule, InvoicesModule, RfisModule, InspectionsModule, ReportsModule, ContractorsModule, ActivitiesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
