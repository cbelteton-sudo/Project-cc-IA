import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user) return null;
    if (!user.password) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, ip: string, userAgent: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
      contractorId: user.contractorId,
      projectMembers:
        user.projectMemberships?.map((m: any) => ({
          projectId: m.projectId,
          role: m.role,
        })) || [],
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' },
    );

    await this.storeRefreshToken(user.id, refreshToken, ip, userAgent);

    return {
      access_token: accessToken,
      refresh_token: refreshToken, // Controller sends this as Cookie (auth_refresh)
      user: payload,
    };
  }

  async refresh(refreshToken: string, ip: string, userAgent: string) {
    try {
      console.log('AuthService.refresh: verifying token...');
      const payload = this.jwtService.verify(refreshToken);
      console.log('AuthService.refresh: payload sub:', payload.sub);

      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        console.error('AuthService.refresh: User not found');
        throw new UnauthorizedException('User not found');
      }

      console.log('AuthService.refresh: finding session...');
      const session = await this.findSession(user.id, refreshToken);
      if (!session) {
        console.error('AuthService.refresh: Session not found or invalid');
        // Reuse detection? Potentially revoke all sessions here
        throw new UnauthorizedException('Invalid Refresh Token');
      }

      if (session.revokedAt) {
        console.error(
          'AuthService.refresh: Session revoked at',
          session.revokedAt,
        );
        throw new UnauthorizedException(
          `DEBUG: Session ${session.id} was revoked at ${session.revokedAt}`,
        );
      }

      // Rotate
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        name: user.name,
        contractorId: user.contractorId,
        projectMembers:
          user.projectMemberships?.map((m: any) => ({
            projectId: m.projectId,
            role: m.role,
          })) || [],
      };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '7d' },
      );

      // Update Session
      await this.updateSession(session.id, newRefreshToken, ip, userAgent);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: newPayload,
      };
    } catch (e) {
      console.error('AuthService.refresh FAILED:', e.message);
      console.error('Stack:', e.stack);
      // Force distinct error message to allow debugging via frontend toast
      throw new UnauthorizedException('DEBUG: ' + e.message);
    }
  }

  async acceptInvite(
    token: string,
    password: string,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.usersService.findUserByInvitationToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    if (user.invitationExpires && new Date() > user.invitationExpires) {
      throw new UnauthorizedException('Invitation token has expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersService.activateUser(user.id, hashedPassword);

    return this.login(user, ip, userAgent);
  }

  async resetOperatorPassword(
    operatorId: string,
    newPassword: string,
  ): Promise<void> {
    console.log(`Resetting password for operator ${operatorId}`);
    // Verify user exists and is an operator/has username
    const user = await this.usersService.findOne(operatorId);
    if (!user || !user.username) {
      // Assuming only operators have username without email effectively? Or just check if they are operator-like
      // For now, strict check not fully implemented, but ensuring they exist
      throw new UnauthorizedException('User not found or not an operator');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.activateUser(operatorId, hashedPassword); // Re-use activate or direct update
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const session = await this.findSession(payload.sub, refreshToken);
      if (session) {
        await this.prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
      }
    } catch (e) {
      // Ignore if token invalid
    }
  }

  // --- Helpers ---

  private async storeRefreshToken(
    userId: string,
    token: string,
    ip: string,
    userAgent: string,
  ) {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress: ip,
        userAgent,
      },
    });
  }

  private async findSession(userId: string, token: string) {
    const sessions = await this.prisma.session.findMany({ where: { userId } });
    console.log(
      `findSession: Found ${sessions.length} sessions for user ${userId}`,
    );
    for (const session of sessions) {
      const isMatch = await bcrypt.compare(token, session.tokenHash);
      if (isMatch) {
        console.log('findSession: MATCH found for session', session.id);
        return session;
      }
    }
    console.log('findSession: NO MATCH found among sessions');
    return null;
  }

  private async updateSession(
    sessionId: string,
    newToken: string,
    ip: string,
    userAgent: string,
  ) {
    const newHash = await bcrypt.hash(newToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        tokenHash: newHash,
        expiresAt,
        ipAddress: ip, // Update suspicious IP change? Or just update current access
        userAgent,
      },
    });
  }
}
