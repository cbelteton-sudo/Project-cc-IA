import { Test, TestingModule } from '@nestjs/testing';
import { ContractorsService } from './contractors.service';
import { PrismaService } from '../../prisma/prisma.service';
import { prismaMock } from '../../../test/mocks/authz.mocks';

describe('ContractorsService', () => {
  let service: ContractorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractorsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ContractorsService>(ContractorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
