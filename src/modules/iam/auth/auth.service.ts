import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { LogInDto } from './dto/log-in.dto';
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
import { IGoogleUser } from 'src/infrastructure/types/interfaces/auth';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) { }

  async signUp(req, signupDto: SignUpDto) {
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

  async logIn(req, logInDto: LogInDto) {
    const user = await this.userService.userExistByEmail(logInDto.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userPassword = await this.userService.findByEmailWithPassword(logInDto.email);

    if (!bcrypt.compareSync(logInDto.password, userPassword)) {
      throw new UnauthorizedException('Contraseña no válida.');
    }

    await this.userService.updateLastLogin(user);

    const { refreshToken, session } = await this.generateAccessRefreshToken(req, user);

    const token = await this.generateAccessToken(user.id, session.id);

    return {
      ok: true,
      token,
      refreshToken,
    };
  }

  async signInWithGoogle(req, signInWithGoogleDto: SignInWithGoogleDto) {
    const googleUser: IGoogleUser = await this.getUserWithGoogleTokens(
      signInWithGoogleDto.accessToken,
    );

    const user = await this.userService.userExistByEmail(googleUser.email);

    if (!user) {
      const userCreated = await this.userService.createWithGoogle(
        googleUser.email,
      );

      // Set email as verified since it's Google authenticated
      userCreated.emailVerified = true;

      // Download and save the avatar
      const avatarFileName = await this.downloadAndSaveGoogleAvatar(
        googleUser.picture,
      );

      if (avatarFileName) userCreated.avatar = avatarFileName;

      userCreated.firstName = googleUser.given_name;
      userCreated.lastName = googleUser.family_name;
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
      };
    }

    await this.userService.updateLastLogin(user);

    const { refreshToken, session } = await this.generateAccessRefreshToken(
      req,
      user,
    );

    const token = await this.generateAccessToken(user.id, session.id);

    return {
      ok: true,
      token,
      refreshToken,
    };
  }

  async generateAccessRefreshToken(req, user: User): Promise<AccessRefreshTokenGenerated> {
    const session = await this.sessionService.createSession(req, user);

    const payload = { userId: user.id, sessionId: session.id };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('session.secretKeyRefresh'),
      expiresIn: this.configService.get<string>('session.jwtTokenRefreshExpiration'),
    });

    return { refreshToken, session };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<string> {
    const refreshTokenData = await this.validateAccessRefreshToken(refreshTokenDto.refreshToken);

    if (!refreshTokenData) {
      throw new UnauthorizedException({
        message: 'Refresh token no valido',
      });
    }

    const session = await this.sessionService.findById(refreshTokenData.sessionId);

    if (!session) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
      });
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
      throw new UnauthorizedException({
        message: 'Token no valido',
      });
    }

    const session = await this.sessionService.findByIds(accessTokenData.userId, accessTokenData.sessionId);

    if (!session) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
      });
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
      if (e instanceof TokenExpiredError) {
        throw new UnauthorizedException('El token ha caducado');
      }
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
      if (e instanceof TokenExpiredError) {
        throw new UnauthorizedException('El refresh token ha caducado');
      }
    }
  }

  async getUserWithGoogleTokens(accessToken: string): Promise<IGoogleUser> {
    try {
      const response = await axios.get('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = response.data;
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid accessToken.');
    }
  }

  private async downloadAndSaveGoogleAvatar(imageUrl: string) {
    try {
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'uploads', 'user', 'avatar');
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate unique filename with uuid
      const fileExtension = '.jpg'; // Google usually serves JPG images
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Download image
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      // Save image to file system
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
  }: {
    email: string;
    emailCode: string;
  }) {
    const user = await this.userService.userExistByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailCode !== emailCode) {
      throw new NotFoundException('Email code not valid');
    }
    user.emailVerified = true;
    user.emailCode = '';
    return this.userService.editProfile(user.id, { emailVerified: true });
  }

}
