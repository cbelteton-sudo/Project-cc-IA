import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if validation fails', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);
      await expect(
        controller.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return access token if validation succeeds', async () => {
      const user = { id: '1', email: 'test@example.com' };
      const resultToken = { access_token: 'jwt_token' };
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(resultToken);

      const result = await controller.login({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).toEqual(resultToken);
      expect(mockAuthService.login).toHaveBeenCalledWith(user);
    });
  });
});
