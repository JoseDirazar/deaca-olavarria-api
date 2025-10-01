import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { SessionService } from './session.service';
import { ConfigService } from '@nestjs/config';

import { AccessRefreshTokenGenerated } from 'src/infrastructure/types/interfaces/session.interface';
import { User } from '@models/User.entity';

import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ValidatedSession } from 'src/infrastructure/types/interfaces/auth';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClientId = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) { }

  async generateAccessAndRefreshToken(req: Request, user: User): Promise<AccessRefreshTokenGenerated> {
    const session = await this.sessionService.createSession(req, user);

    const payload = { userId: user.id, sessionId: session.id, user };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('session.secretKeyRefresh'),
      expiresIn: this.configService.get<string>('session.jwtTokenRefreshExpiration'),
    });

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('session.secretKey'),
      expiresIn: this.configService.get<string>('session.jwtTokenExpiration'),
    });

    return { accessToken, refreshToken, session };
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
    console.log("accessToken SERVICE", accessToken);
    console.log("refreshToken SERVICE", refreshToken);

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

    const session = await this.sessionService.findByIds(accessTokenData.sessionId);

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
      console.log("accessToken validateAccessToken", data);
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


  async signOut(sessionId: string) {
    await this.sessionService.removeSession(sessionId);
  }
}
