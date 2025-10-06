import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { SessionService } from './session.service';
import { ConfigService } from '@nestjs/config';

import { AccessRefreshTokenGenerated } from 'src/infrastructure/types/interfaces/session.interface';
import { User } from '@models/User.entity';
import * as argon2 from 'argon2';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ValidatedSession } from 'src/infrastructure/types/interfaces/auth';
import { UserService } from '../user/user.service';
import { compare } from 'bcrypt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClientId = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY) private readonly refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private readonly userService: UserService,
  ) { }

  async generateAccessAndRefreshToken(req: Request, user: User) {
    const session = await this.sessionService.createSession(req, user);

    const payload = { sub: user.id, sessionId: session.id, user };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshJwtConfiguration),
    ]);

    await this.sessionService.updateHashedRefreshToken(session.id, refreshToken);

    return { accessToken };
  }

  async refreshAccessToken(refreshAccessTokenData: ValidatedSession): Promise<{ accessToken: string, refreshToken: string }> {

    const payload = {
      userId: refreshAccessTokenData.user.id,
      sessionId: refreshAccessTokenData.sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('session.secretKey'),
      expiresIn: this.configService.get<string>('session.jwtTokenExpiration'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('session.secretKeyRefresh'),
      expiresIn: this.configService.get<string>('session.jwtTokenRefreshExpiration'),
    });


    return { accessToken, refreshToken };
  }

  async generateAccessToken(userId: string, sessionId: string): Promise<string> {
    const payload = { userId: userId, sessionId: sessionId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('session.secretKey'),
      expiresIn: this.configService.get<string>('session.jwtTokenExpiration'),
    });

    return accessToken;
  }

  async validateSession(accessToken: string): Promise<ValidatedSession> {
    if (!accessToken) {
      throw new UnauthorizedException({
        message: 'Token no valido',
      });
    }

    const accessTokenData = await this.validateAccessToken(accessToken);

    if (!accessTokenData) {
      throw new UnauthorizedException({ message: 'Token no valido' });
    }

    const session = await this.sessionService.findOne(accessTokenData.sessionId);

    if (!session) {
      throw new UnauthorizedException({ message: 'Unauthorized' });
    }

    return { user: accessTokenData.user, sessionId: accessTokenData.sessionId };
  }

  async validateAccessToken(accessToken: string) {
    try {
      const data = this.jwtService.verify(accessToken, {
        secret: this.configService.get<string>('session.secretKey'),
      });
      return data;
    } catch (e) {
      if (e instanceof TokenExpiredError) throw new UnauthorizedException('El token ha caducado');
      return null;
    }
  }

  async validateRefreshToken(refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('session.secretKeyRefresh'),
      });

      return data;
    } catch (e) {
      if (e instanceof TokenExpiredError) throw new UnauthorizedException('El refresh token ha caducado');
    }
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


  async getSession(sessionId: string) {
    return await this.sessionService.findOne(sessionId);
  }

  async deleteSession(sessionId: string) {
    return await this.sessionService.removeSession(sessionId);
  }

  async validateUser(email: string, password: string): Promise<{ id: string, }> {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('User not found');
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch) throw new UnauthorizedException('Password not valid');
    return { id: user.id, };
  }

  async login(sessionId: string, userId: string) {

    const { accessToken, refreshToken } = await this.generateTokens(sessionId, userId)
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.updateHashedRefreshToken(sessionId, hashedRefreshToken);

    return { id: sessionId, accessToken, refreshToken };
  }

  refreshToken(sessionId: string, userId: string) {
    const payload: AuthJwtPayload = { sub: userId, sessionId };
    const accessToken = this.jwtService.sign(payload);
    return { id: sessionId, accessToken };
  }

  async generateTokens(sessionId: string, userId: string) {
    const payload: AuthJwtPayload = { sub: userId, sessionId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshJwtConfiguration),
    ]);
    return { accessToken, refreshToken };
  }


  async updateHashedRefreshToken(sessionId: string, hasedRefreshToken: string) {
    return await this.sessionService.updateHashedRefreshToken(sessionId, hasedRefreshToken);
  }

  async validateRefreshTokenV2(sessionId: string, refreshToken: string) {
    const session = await this.getSession(sessionId);
    if (!session) throw new UnauthorizedException('Session not found');
    const isRefreshTokenMatch = await argon2.verify(session.refreshToken, refreshToken);
    if (!isRefreshTokenMatch) throw new UnauthorizedException('Refresh token not valid');
    return { sessionId: session.id };
  }

  async logout(sessionId: string) {
    return await this.deleteSession(sessionId);
  }
}