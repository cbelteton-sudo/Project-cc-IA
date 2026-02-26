import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  Req,
  HttpCode,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';

import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Helper to force clear a cookie with all possible option permutations
  private forceClearCookie(res: Response, name: string) {
    const paths = ['/', '/api'];
    const secures = [true, false];
    const sameSites = ['lax', 'strict', 'none'] as const;

    paths.forEach((path) => {
      secures.forEach((secure) => {
        // Try simple clear first
        res.clearCookie(name, { path, secure, httpOnly: true });
        res.clearCookie(name, {
          path,
          secure,
          httpOnly: true,
          sameSite: 'lax',
        });
      });
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @Post('login')
  async login(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    try {
      console.log('🔥 [DEBUG] AuthController.login HIT w/ email:', body.email);

      const user = await this.authService.validateUser(
        body.email,
        body.password,
      );
      if (!user) {
        console.warn('⚠️ [DEBUG] Invalid credentials for:', body.email);
        throw new UnauthorizedException('Invalid credentials');
      }

      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      console.log('🔍 [DEBUG] Calling AuthService.login...');
      const result = await this.authService.login(user, ip, userAgent);
      console.log(
        '✅ [DEBUG] AuthService.login returned keys:',
        Object.keys(result),
      );

      const { access_token, refresh_token, user: userData } = result;

      if (!access_token) {
        console.error('❌ [CRITICAL] AuthService returned NO access_token!');
        throw new Error('Internal Auth Error: No token generated');
      }

      // Force Clear ANY existing cookie before setting new one to avoid duplicates
      this.forceClearCookie(res, 'fieldclose_sess_v3');
      this.forceClearCookie(res, 'fieldclose_sess_v4');
      this.forceClearCookie(res, 'fieldclose_sess_v5');
      this.forceClearCookie(res, 'fieldclose_sess_v6');

      // Set Refresh Token in HttpOnly Cookie
      res.cookie('fieldclose_sess_v6', refresh_token, {
        httpOnly: true,
        secure: false, // FORCE FALSE for localhost/http debugging
        sameSite: 'lax',
        path: '/api', // RESTRICT to API
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log(
        '🚀 [DEBUG] Returning response with access_token length:',
        access_token.length,
        ' | Cookie set: fieldclose_sess_v6 | Prefix:',
        refresh_token.substring(0, 10),
      );
      return { access_token, user: userData };
    } catch (e) {
      console.error('❌ [LOGIN FATAL ERROR]', e);
      // Re-throw known HTTP exceptions
      if (e instanceof UnauthorizedException) throw e;
      // Wrap unknown errors in InternalServerErrorException to reveal message to client
      throw new InternalServerErrorException(`Login Failed: ${e.message}`);
    }
  }

  @Post('accept-invite')
  async acceptInvite(
    @Body() body: { token: string; password: string },
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const { access_token, refresh_token, user } =
      await this.authService.acceptInvite(
        body.token,
        body.password,
        ip,
        userAgent,
      );

    // Force Clear ANY existing cookie before setting new one
    this.forceClearCookie(res, 'fieldclose_sess_v3');
    this.forceClearCookie(res, 'fieldclose_sess_v4');
    this.forceClearCookie(res, 'fieldclose_sess_v5');
    this.forceClearCookie(res, 'fieldclose_sess_v6');

    // Set Refresh Token in HttpOnly Cookie
    res.cookie('fieldclose_sess_v6', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token, user };
  }

  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('🔄 [DEBUG-V6] /auth/refresh CALLED - PATH /api');
    const cookies = req.cookies || {};
    console.log('🍪 [DEBUG-V6] All Cookies Keys:', Object.keys(cookies));
    console.log(
      '🍪 [DEBUG-V6] fieldclose_sess_v6 prefix:',
      cookies['fieldclose_sess_v6']?.substring(0, 10),
    );

    const refreshToken = cookies['fieldclose_sess_v6'];
    if (!refreshToken) {
      console.warn(
        '❌ [DEBUG-V6 FIX] No fieldclose_sess_v6 cookie found. Throwing Unauthorized.',
      );
      throw new UnauthorizedException('No Refresh Token');
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      const { access_token, refresh_token, user } =
        await this.authService.refresh(refreshToken, ip, userAgent);

      console.log('🔐 Rotating Cookie with options:', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api',
      });

      // Force Clear ANY existing cookie before setting new one
      this.forceClearCookie(res, 'fieldclose_sess_v3');
      this.forceClearCookie(res, 'fieldclose_sess_v4');
      this.forceClearCookie(res, 'fieldclose_sess_v5');
      this.forceClearCookie(res, 'fieldclose_sess_v6');

      // Rotate Refresh Token Cookie
      res.cookie('fieldclose_sess_v6', refresh_token, {
        httpOnly: true,
        secure: false, // FORCE FALSE for localhost/http debugging
        sameSite: 'lax',
        path: '/api',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log('✅ Refresh successful for user:', user.email);
      return { access_token, user };
    } catch (e) {
      console.error('❌ Refresh failed:', e.message);
      throw e;
    }
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken =
      req.cookies['fieldclose_sess_v6'] ||
      req.cookies['fieldclose_sess_v5'] ||
      req.cookies['fieldclose_sess_v4'] ||
      req.cookies['session_v2'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    this.forceClearCookie(res, 'fieldclose_sess_v6');
    this.forceClearCookie(res, 'fieldclose_sess_v5');
    this.forceClearCookie(res, 'fieldclose_sess_v4');
    this.forceClearCookie(res, 'fieldclose_sess_v3');
    this.forceClearCookie(res, 'session_v2');
    this.forceClearCookie(res, 'auth_refresh');
    this.forceClearCookie(res, 'refreshToken');

    return { message: 'Logged out successfully' };
  }
}
