import { Test, TestingModule } from '@nestjs/testing';
import { ContractorsService } from './contractors.service';

describe('ContractorsService', () => {
  let service: ContractorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractorsService],
    }).compile();

    service = module.get<ContractorsService>(ContractorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
