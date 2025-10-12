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
import { GetSessionId } from 'src/infrastructure/decorators/get-session-id.decorator';
import { SignUpDto } from './dto/sign-up.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ApiResponse } from 'src/infrastructure/types/interfaces/api-response.interface';
import { User } from '@models/User.entity';
import { UserService } from '../user/user.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { SignInWithGoogleDto } from './dto/sign-in-with-google.dto';
import { TokenPayload } from 'google-auth-library';
import { ResendEmailCodeDto } from './dto/resend-email-code.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) { }

  @Post('sign-up')
  async createUser(
    @Body() { email, password, firstName, lastName }: SignUpDto,
  ) {
    const userExist = await this.userService.userExistByEmail(email);
    if (userExist) throw new BadRequestException('User already exists');

    await this.userService.createUser({
      email,
      password,
      firstName,
      lastName,
    });

    return { message: 'Bienvenido a deacá' };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @GetUser() user: User) {
    const { accessToken, refreshToken } = await this.authService.login(req, user);
    this.authService.setCookie(res, refreshToken);
    return { message: 'Bienvenido!', data: { accessToken } };
  }

  @HttpCode(HttpStatus.OK)
  @Post('google-auth')
  async signInWithGoogle(
    @Body() logInWithGoogleDto: SignInWithGoogleDto,
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const googleUser: TokenPayload = await this.authService.getUserWithGoogleTokens(logInWithGoogleDto.accessToken);
    if (!googleUser.email) throw new BadRequestException('Access token no valido');
    let user = await this.userService.userExistByEmail(googleUser.email);

    if (!user) {
      const userCreated = await this.userService.createWithGoogle(googleUser);
      user = userCreated;
    }
    const { accessToken, refreshToken } = await this.authService.generateAccessAndRefreshToken(request, user);
    await this.userService.updateLastLogin(user);
    this.authService.setCookie(res, refreshToken);
    return { message: 'Bienvenido!', data: { accessToken } };
  }

  @Post('refresh')
  @UseGuards(RefreshAuthGuard)
  async refreshToken(@GetUser("sessionId") sessionId: string, @GetUser("id") sub: string, @GetUser("role") role: string) {
    const accessToken = await this.authService.refreshToken({
      sessionId,
      sub,
      role,
    });

    return { data: { accessToken } };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @GetUser("sessionId") sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.authService.clearCookie(res);
    await this.authService.logout(sessionId);
    return { message: 'Gracias por utilizar deacá.' };
  }

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
    return { message: 'Email verificado!' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('request-password-reset')
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<ApiResponse<void>> {
    const user = await this.userService.getUserWithUnselectableFields(
      requestPasswordResetDto.email,
    );
    if (!user) throw new NotFoundException('User not found');
    await this.userService.generateResetCodeAndUpdateUser(user);
    await this.userService.sendEmailVerificationCode(user);
    return { message: 'Password reset request sent successfully' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
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

    await this.userService.changePassword(
      existingUser,
      dto.newPassword,
    );

    return { message: 'Contraseña actualizada!' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() { email }: ResendEmailCodeDto) {
    const user = await this.userService.getVerificationCode(email);
    if (!user) throw new NotFoundException('User not found');
    await this.userService.sendEmailVerificationCode(user);
    return { message: 'Verification email sent successfully' };
  }
}
