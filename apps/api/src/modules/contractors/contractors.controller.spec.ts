import { Test, TestingModule } from '@nestjs/testing';
import { ContractorsController } from './contractors.controller';

describe('ContractorsController', () => {
  let controller: ContractorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractorsController],
    }).compile();

    controller = module.get<ContractorsController>(ContractorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
