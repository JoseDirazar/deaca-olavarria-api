import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { ConfigService, ConfigType } from '@nestjs/config';
import { Request } from 'express';
import { User } from '@models/User.entity';
import * as argon2 from 'argon2';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { UserService } from '../user/user.service';
import { compare } from 'bcrypt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import refreshJwtConfig from 'src/config/refresh-jwt.config';


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
    const payload: AuthJwtPayload = { sub: user.id, sessionId: session.id };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshJwtConfiguration),
    ]);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.sessionService.updateHashedRefreshToken(session.id, hashedRefreshToken);
    return { accessToken, refreshToken, sessionId: session.id };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('User not found');
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch) throw new UnauthorizedException('Password not valid');
    return { id: user.id };
  }

  async login(req: Request, userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const { accessToken, refreshToken, sessionId } = await this.generateAccessAndRefreshToken(req, user);
    return { id: sessionId, accessToken, refreshToken };
  }

  refreshToken(sessionId: string, userId: string) {
    const payload: AuthJwtPayload = { sub: userId, sessionId };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async validateRefreshTokenV2(sessionId: string, refreshToken: string) {
    const session = await this.getSession(sessionId);
    if (!session) throw new UnauthorizedException('Session not found');
    const isRefreshTokenMatch = await argon2.verify(session.refreshToken, refreshToken);
    if (!isRefreshTokenMatch) throw new UnauthorizedException('Refresh token not valid');
    return { id: session.user.id, sessionId: session.id };
  }

  async logout(sessionId: string) {
    return await this.deleteSession(sessionId);
  }

  async validateJwtPayload(userId: string, sessionId: string) {
    const session = await this.sessionService.findOne(sessionId);
    if (!session || session.user.id !== userId) throw new UnauthorizedException('Unauthorized');
    return { id: userId, sessionId };
  }

  async getSession(sessionId: string) {
    return await this.sessionService.findOne(sessionId);
  }

  async deleteSession(sessionId: string) {
    return await this.sessionService.removeSession(sessionId);
  }