import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SignInWithGoogleDto } from './dto/sign-in-with-google.dto';
import { Public } from 'src/infrastructure/decorators/public-route.decorator';
import { GetSessionId } from 'src/infrastructure/decorators/get-session-id.decorator';
import { SignUpDto } from './dto/sign-up.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SignInDto } from './dto/log-in.dto';

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
  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Req()
    request: Request,
  ) {
    const userResponse = await this.authService.signIn(request, signInDto);
    return userResponse;
  }

  @Public()
  @Post('google-auth')
  async logInWithGoogle(
    @Body() logInWithGoogleDto: SignInWithGoogleDto,
    @Req()
    request: Request,
  ) {
    const userResponse = await this.authService.signInWithGoogle(request, logInWithGoogleDto);
    return userResponse;
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @GetSessionId() sessionId: string) {
    const token = await this.authService.refreshToken(refreshTokenDto, sessionId);
    return { ok: true, token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sign-out')
  signOut(@GetSessionId() sessionId: string) {
    this.authService.signOut(sessionId);
    return { ok: true };
  }

  @Public()
  @Post('confirm-email')
  async confirmEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.confirmEmail(dto);
  }

  @Public()
  @Post('request-password-reset')
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Req() req: Request,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword({ req, ...dto });
  }
}
