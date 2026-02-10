import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
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
import { ActivitiesModule } from './modules/activities/activities.module';
import { FieldUpdatesModule } from './modules/field-updates/field-updates.module';
import { PhotosModule } from './modules/photos/photos.module';
import { IssuesModule } from './modules/issues/issues.module';
import { DailyLogModule } from './modules/daily-log/daily-log.module';
import { FieldReportsModule } from './modules/field-reports/field-reports.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PMDashboardModule } from './modules/pm-dashboard/pm-dashboard.module';
import { ContractorsModule } from './modules/contractors/contractors.module';

@Module({
  imports: [
    TenantsModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    BudgetsModule,
    ChangeOrdersModule,
    MaterialsModule,
    MaterialRequestsModule,
    PurchaseOrdersModule,
    RfqsModule,
    ProgressEstimatesModule,
    SubcontractsModule,
    InvoicesModule,
    RfisModule,
    ActivitiesModule,
    FieldUpdatesModule,
    PhotosModule,
    IssuesModule,
    DailyLogModule,
    FieldReportsModule,
    ReportsModule,
    NotificationsModule,
    PMDashboardModule,
    ContractorsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
