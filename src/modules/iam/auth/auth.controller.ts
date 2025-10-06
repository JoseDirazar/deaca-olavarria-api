import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SignInWithGoogleDto } from './dto/sign-in-with-google.dto';
import { Public } from 'src/infrastructure/decorators/public-route.decorator';
import { GetSessionId } from 'src/infrastructure/decorators/get-session-id.decorator';
import { SignUpDto } from './dto/sign-up.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ApiResponse } from 'src/infrastructure/types/interfaces/api-response.interface';
import { User } from '@models/User.entity';
import { UserService } from '../user/user.service';
import { TokenPayload } from 'google-auth-library';
import { SessionService } from './session.service';
import { compare } from 'bcrypt';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('sign-up')
  async createUser(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() { email, password, firstName, lastName }: SignUpDto,
  ) {
    if (!email || !password)
      throw new BadRequestException('Email y password son obligatorios');
    const userExist = await this.userService.userExistByEmail(email);

    const user = await this.userService.createUser({
      email,
      password,
      firstName,
      lastName,
    });
    const { accessToken, refreshToken, sessionId } =
      await this.authService.generateAccessAndRefreshToken(req, user);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { ok: true, data: { accessToken, sessionId } };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto, @Req() request) {
    const userWithPassword = await this.userService.findByEmailWithPassword(
      signInDto.email,
    );
    if (!userWithPassword) throw new NotFoundException('User not found');
    if (!(await compare(signInDto.password, userWithPassword?.password ?? '')))
      throw new UnauthorizedException('Contraseña no válida.');
    const { password, ...user } = userWithPassword as any;
    await this.userService.updateLastLogin(userWithPassword);
    const { accessToken, refreshToken, sessionId } =
      await this.authService.generateAccessAndRefreshToken(request, user);
    request.res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { ok: true, data: { accessToken, sessionId } };
  }

  // Google auth endpoint omitted for now (legacy code removed)

  // Legacy refresh-accesstoken endpoint removed in favor of /auth/refresh with RefreshAuthGuard

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('sign-out')
  async signOut(@GetSessionId() sessionId: string): Promise<ApiResponse<void>> {
    if (!sessionId) throw new BadRequestException('Session id is required');
    const session = await this.authService.getSession(sessionId);
    if (!session) throw new UnauthorizedException('Unauthorized');
    await this.authService.deleteSession(sessionId);
    return { ok: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('confirm-email')
  async confirmEmail(@Body() dto: VerifyEmailDto): Promise<ApiResponse<User>> {
    const user = await this.userService.getVerificationCode(dto.email);
    if (!user) throw new NotFoundException('User not found');
    if (user.emailCode !== dto.emailCode)
      throw new NotFoundException('Email code not valid');

    const updatedUser =
      await this.userService.verifyEmailAndResetEmailCode(user);
    this.userService.editProfile(user, updatedUser);
    return { ok: true, data: updatedUser };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('request-password-reset')
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<ApiResponse<void>> {
    const user = await this.userService.getUserWithUnselectableFields(
      requestPasswordResetDto.email,
    );
    if (!user) throw new NotFoundException('User not found');
    this.userService.generateResetCodeAndUpdateUser(user);
    this.userService.sendEmailVerificationCode(user);
    return { ok: true };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Req() req: Request, @Body() dto: ResetPasswordDto) {
    const existingUser = await this.userService.getResssetCodeAndPassword(
      dto.email,
    );
    if (!existingUser) throw new NotFoundException('User not found');
    if (existingUser.emailCode !== dto.resetCode)
      throw new UnauthorizedException('Invalid reset code');
    const codeAge =
      Date.now() - new Date(existingUser.emailCodeCreatedAt).getTime();
    if (codeAge > 3600000 * 24)
      throw new UnauthorizedException('Reset code has expired');

    const updatedUserData = await this.userService.changePassword(
      existingUser,
      dto.newPassword,
    );

    // const { accessToken, refreshToken } = await this.authService.generateAccessAndRefreshToken(req, updatedUserData);
    return {
      ok: true,
      message: 'Password updated successfully',
      data: { user: updatedUserData },
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const {
      accessToken,
      refreshToken,
      id: sessionId,
    } = await this.authService.login(req, (req as any).user.id);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { ok: true, data: { accessToken, sessionId } };
  }

  @Post('refresh')
  @UseGuards(RefreshAuthGuard)
  async refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.rotateAccessAndRefreshToken(
        req.user.sessionId,
        req.user.id,
      );
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { ok: true, data: { accessToken } };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @GetSessionId() sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('refresh_token', { path: '/' });
    return this.authService.logout(sessionId);
  }
}
