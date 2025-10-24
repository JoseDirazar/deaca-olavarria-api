import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { ConfigService, ConfigType } from '@nestjs/config';
import { Request, Response } from 'express';
import { User } from '@models/User.entity';
import * as argon2 from 'argon2';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { UserService } from '../user/user.service';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { parseDurationToMs } from 'src/infrastructure/utils/parseDurationToMs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClientId = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private readonly refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private readonly userService: UserService,
  ) {}

  async generateAccessAndRefreshToken(req: Request, user: User) {
    const session = await this.sessionService.createSession(req, user);
    const payload: AuthJwtPayload = { sub: user.id, sessionId: session.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshJwtConfiguration),
    ]);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.sessionService.updateHashedRefreshToken(session.id, hashedRefreshToken);
    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('User not found');
    const isPasswordMatch = await argon2.verify(user.password, password);
    if (!isPasswordMatch) throw new UnauthorizedException('Password not valid');
    return user;
  }

  async login(req: Request, user: User) {
    const { accessToken, refreshToken } = await this.generateAccessAndRefreshToken(req, user);
    return { id: user.id, accessToken, refreshToken };
  }

  async getUserWithGoogleTokens(idToken: string): Promise<TokenPayload> {
    try {
      const ticket = await this.googleClientId.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('Invalid accessToken.');
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid accessToken.');
    }
  }

  async refreshToken(payload: AuthJwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }

  async logout(sessionId: string) {
    return await this.deleteSession(sessionId);
  }

  async validateJwtPayload(userId: string, sessionId: string) {
    const session = await this.getSession(sessionId);

    if (!session || session.user.id !== userId) throw new UnauthorizedException('Unauthorized');
    return { id: userId, sessionId, role: session.user.role };
  }

  async validateRefreshJwtPayload(payload: AuthJwtPayload, refreshToken?: string) {
    const session = await this.getSession(payload.sessionId);
    if (!session || session.user.id !== payload.sub || !refreshToken || !session.refreshToken)
      throw new UnauthorizedException('Unauthorized');
    const isRefreshTokenMatch = await argon2.verify(session?.refreshToken, refreshToken);
    if (!isRefreshTokenMatch) throw new UnauthorizedException('Refresh token not valid');
    return { id: payload.sub, sessionId: payload.sessionId, role: session.user.role };
  }

  async getSession(sessionId: string) {
    return await this.sessionService.findOne(sessionId);
  }

  async deleteSession(sessionId: string) {
    return await this.sessionService.removeSession(sessionId);
  }

  setCookie(res: Response, refreshToken: string) {
    const maxAge = parseDurationToMs(process.env.REFRESH_JWT_EXPIRE_IN || '7d');
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge,
    });
  }

  clearCookie(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
  }
}
