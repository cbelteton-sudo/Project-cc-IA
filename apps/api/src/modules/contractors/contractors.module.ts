import { Module } from '@nestjs/common';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';

import { ContractorPortalController } from './contractor-portal.controller';

@Module({
  controllers: [ContractorsController, ContractorPortalController],
  providers: [ContractorsService]
})
export class ContractorsModule { }
