import { Test, TestingModule } from '@nestjs/testing';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { ProjectAuthGuard } from '../../common/guards/project-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  projectAuthGuardMock,
  permissionsGuardMock,
} from '../../../test/mocks/authz.mocks';

describe('ContractorsController', () => {
  let controller: ContractorsController;

  const mockContractorsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractorsController],
      providers: [
        {
          provide: ContractorsService,
          useValue: mockContractorsService,
        },
      ],
    })
      .overrideGuard(ProjectAuthGuard)
      .useValue(projectAuthGuardMock)
      .overrideGuard(PermissionsGuard)
      .useValue(permissionsGuardMock)
      .compile();

    controller = module.get<ContractorsController>(ContractorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
