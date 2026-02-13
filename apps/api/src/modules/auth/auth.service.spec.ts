import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongPassword',
      );
      expect(result).toBeNull();
    });

    it('should return user result without password if validation succeeds', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result.password).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const user = { id: '1', email: 'test@example.com', role: 'ADMIN' };
      const token = 'jwt_token';
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(user);
      expect(result).toEqual({ access_token: token });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        tenantId: undefined, // undefined based on mock user
        role: user.role,
        contractorId: undefined, // undefined based on mock user
        name: undefined, // undefined based on mock user
      });
    });
  });
});
