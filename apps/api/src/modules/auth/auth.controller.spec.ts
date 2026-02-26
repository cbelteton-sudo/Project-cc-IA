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
      const req: any = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
      };
      const res: any = { cookie: jest.fn(), clearCookie: jest.fn() };
      const body = { email: 'test@example.com', password: 'wrong' };

      await expect(controller.login(body, res, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return access token if validation succeeds', async () => {
      const user = { id: 'test-user', email: 'test@example.com' };
      const req: any = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        user,
      };
      const res: any = { cookie: jest.fn(), clearCookie: jest.fn() };
      const body = { email: 'test@example.com', password: 'password123' };

      const resultToken = {
        access_token: 'jwt_token',
        refresh_token: 'refresh_token',
        user: { id: 'test-user' },
      };

      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(resultToken);

      const result = await controller.login(body, res, req);
      expect(result).toEqual({
        access_token: 'jwt_token',
        user: { id: 'test-user' },
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(
        user,
        '127.0.0.1',
        'test-agent',
      );
    });
  });
});
