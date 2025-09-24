import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { LogInDto } from './dto/log-in.dto';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '@models/User.entity';
import { SignInWithGoogleDto } from './dto/sign-in-with-google.dto';
import { Public } from 'src/infrastructure/decorators/public-route.decorator';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { GetSessionId } from 'src/infrastructure/decorators/get-session-id.decorator';
import { SignUpDto } from './dto/sign-up.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('sign-up')
  async createUser(@Req() req: Request, @Body() dto: SignUpDto) {
    if (!dto.email || !dto.password) throw new BadRequestException('Email y password son obligatorios');
    const serviceResponse = await this.authService.signUp(req, dto);

    return serviceResponse;
  }

  @Public()
  @Post('log-in')
  async logIn(
    @Body() logInDto: LogInDto,
    @Req()
    request,
  ) {
    const userResponse = await this.authService.logIn(request, logInDto);
    return userResponse;
  }

  @Public()
  @Post('google-auth')
  async logInWithGoogle(
    @Body() logInWithGoogleDto: SignInWithGoogleDto,
    @Req()
    request,
  ) {
    const userResponse = await this.authService.signInWithGoogle(request, logInWithGoogleDto);
    console.log({ userResponse })
    return userResponse;
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @GetSessionId() sessionId: string) {
    const token = await this.authService.refreshToken(refreshTokenDto, sessionId);
    return { ok: true, token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('log-out')
  getProfile(@GetUser() user: User, @GetSessionId() sessionId: number) {
    return { ok: true, user, sessionId };
  }

  @Public()
  @Post('confirm-email')
  async confirmEmail({
    email,
    emailCode,
  }: {
    email: string;
    emailCode: string;
  }) {
    return this.authService.confirmEmail({ email, emailCode });
  }

  @Public()
  @Post('request-password-reset')
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Req() request: Request,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      request,
      dto.email,
      dto.resetCode,
      dto.newPassword,
    );
  }
}
