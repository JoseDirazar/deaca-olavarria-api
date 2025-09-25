import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { SignInDto } from './dto/log-in.dto';
import { SessionService } from './session.service';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignInWithGoogleDto } from './dto/sign-in-with-google.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AccessRefreshTokenGenerated, validatedSession } from 'src/infrastructure/types/interfaces/session.interface';
import { User } from '@models/User.entity';
import path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) { }

  async signUp(req: Request, signupDto: SignUpDto) {
    const userExist = await this.userService.userExistByEmail(signupDto.email);
    if (userExist) throw new NotFoundException('El usuario ya existe');

    const user = await this.userService.createUser(signupDto);

    const { refreshToken, session } = await this.generateAccessRefreshToken(req, user);

    const accessToken = await this.generateAccessToken(user.id, session.id);

    return {
      ok: true,
      accessToken,
      refreshToken,
    };
  }

  async signIn(req: Request, signInDto: SignInDto) {
    const user = await this.userService.userExistByEmail(signInDto.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userPassword = await this.userService.findByEmailWithPassword(signInDto.email);

    if (!userPassword) {
      throw new UnauthorizedException('Contraseña no válida.');
    }
    console.log("BCRYPT COMPARE: ", bcrypt.compareSync(signInDto.password, userPassword));
    if (!bcrypt.compareSync(signInDto.password, userPassword)) {
      throw new UnauthorizedException('Contraseña no válida.');
    }

    await this.userService.updateLastLogin(user);

    const { refreshToken, session } = await this.generateAccessRefreshToken(req, user);

    const token = await this.generateAccessToken(user.id, session.id);

    return {
      ok: true,
      token,
      refreshToken,
      user,
    };
  }

  async signInWithGoogle(req: Request, signInWithGoogleDto: SignInWithGoogleDto) {
    const googleUser: TokenPayload = await this.getUserWithGoogleTokens(
      signInWithGoogleDto.accessToken,
    );
    const user = await this.userService.userExistByEmail(googleUser.email!);

    if (!user) {
      const userCreated = await this.userService.createWithGoogle(
        googleUser.email!,
      );

      userCreated.emailVerified = true;
      userCreated.avatar = googleUser?.picture || "";
      userCreated.firstName = googleUser?.given_name || "";
      userCreated.lastName = googleUser?.family_name || "";
      await this.userService.createUser(userCreated);

      await this.userService.updateLastLogin(userCreated);

      const { refreshToken, session } = await this.generateAccessRefreshToken(
        req,
        userCreated,
      );

      const token = await this.generateAccessToken(userCreated.id, session.id);

      return {
        ok: true,
        token,
        refreshToken,
        user: userCreated,
      };
    }

    user.avatar = googleUser?.picture || "";
    user.firstName = googleUser?.given_name || "";
    user.lastName = googleUser?.family_name || "";
    user.emailVerified = true;

    await this.userService.editProfile(user, user);
    await this.userService.updateLastLogin(user);

    const { refreshToken, session } = await this.generateAccessRefreshToken(
      req,
      user,
    );

    const accessToken = await this.generateAccessToken(user.id, session.id);

    return {
      ok: true,
      accessToken,
      refreshToken,
      user
    };
  }

  async generateAccessRefreshToken(req: Request, user: User): Promise<AccessRefreshTokenGenerated> {
    const session = await this.sessionService.createSession(req, user);

    const payload = { userId: user.id, sessionId: session.id };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('session.secretKeyRefresh'),
      expiresIn: this.configService.get<string>('session.jwtTokenRefreshExpiration'),
    });

    return { refreshToken, session };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto, sessionId: string): Promise<string> {
    await this.sessionService.removeSession(sessionId);

    const refreshTokenData = await this.validateAccessRefreshToken(refreshTokenDto.refreshToken);

    if (!refreshTokenData) {
      throw new UnauthorizedException({ message: 'Refresh token no valido', });
    }

    const session = await this.sessionService.findById(refreshTokenData.sessionId);

    if (!session) {
      throw new UnauthorizedException({ message: 'Unauthorized' });
    }

    const payload = {
      userId: refreshTokenData.userId,
      sessionId: refreshTokenData.sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('session.secretKey'),
      expiresIn: this.configService.get<string>('session.jwtTokenExpiration'),
    });

    return accessToken;
  }

  async generateAccessToken(userId, sessionId): Promise<string> {
    const payload = { userId: userId, sessionId: sessionId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('session.secretKey'),
      expiresIn: this.configService.get<string>('session.jwtTokenExpiration'),
    });

    return accessToken;
  }

  async validateSession(accessToken: string): Promise<validatedSession> {
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

    const user = await this.userService.findById(accessTokenData.userId);

    return { user: user, sessionId: accessTokenData.sessionId };
  }

  async validateAccessToken(accessToken) {
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

  async validateAccessRefreshToken(refreshToken) {
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
      const ticket = await this.client.verifyIdToken({
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

  private async downloadAndSaveGoogleAvatar(imageUrl: string) {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'user', 'avatar');
      await fs.mkdir(uploadDir, { recursive: true });

      const fileExtension = '.jpg';
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      await fs.writeFile(filePath, response.data);

      return fileName;
    } catch (error) {
      console.error('Error saving Google avatar:', error);
      return null;
    }
  }

  async confirmEmail({
    email,
    emailCode,
  }: VerifyEmailDto) {
    const user = await this.userService.getVerificationCode(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.emailCode !== emailCode) {
      throw new NotFoundException('Email code not valid');
    }
    user.emailVerified = true;
    user.emailCode = '';
    return this.userService.editProfile(user, user);
  }

  async requestPasswordReset(email: string) {
    await this.userService.requestPasswordResetCode(email);
    return { ok: true, message: 'Reset code sent to email' };
  }

  async resetPassword(
    {
      email,
      resetCode,
      newPassword,
      req,
    }: ResetPasswordDto & { req: Request }
  ) {
    const user = await this.userService.getResssetCodeAndPassword(email);
    if (!user) throw new NotFoundException('User not found');

    if (user.emailCode !== resetCode) throw new UnauthorizedException('Invalid reset code');

    const codeAge = Date.now() - new Date(user.emailCodeCreatedAt).getTime();

    if (codeAge > 3600000 * 24) throw new UnauthorizedException('Reset code has expired');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.emailCode = '';
    await this.userService.editProfile(user, user);

    const { refreshToken, session } = await this.generateAccessRefreshToken(req, user);
    const accessToken = await this.generateAccessToken(user.id, session.id);

    return {
      ok: true,
      message: 'Password updated successfully',
      accessToken,
      refreshToken,
      user,
    };
  }

  async signOut(sessionId: string) {
    await this.sessionService.removeSession(sessionId);
    return { ok: true, message: 'User signed out successfully' };
  }
}
