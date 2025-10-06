import { BadRequestException, Body, Controller, HttpCode, HttpStatus, NotFoundException, Post, Req, Request, UnauthorizedException, UseGuards } from '@nestjs/common';

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
import { SignInDto } from './dto/sign-in.dto';
import { ApiResponse } from 'src/infrastructure/types/interfaces/api-response.interface';
import { User } from '@models/User.entity';
import { UserService } from '../user/user.service';
import { TokenPayload } from 'google-auth-library';
import { SessionService } from './session.service';
import { compare } from 'bcrypt';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
  ) { }

  @Public()
  @Post('sign-up')
  async createUser(@Req() req: Request, @Body() { email, password, firstName, lastName }: SignUpDto): Promise<ApiResponse<{ user: User }>> {
    if (!email || !password) throw new BadRequestException('Email y password son obligatorios');
    const userExist = await this.userService.userExistByEmail(email);
    if (userExist) throw new NotFoundException('El usuario ya existe');

    const user = await this.userService.createUser({ email, password, firstName, lastName });
    // const { accessToken, refreshToken } = await this.authService.generateAccessAndRefreshToken(req, user);

    return { ok: true, data: { user } };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Req() request: Request,
  ) {
    const userWithPassword = await this.userService.findByEmailWithPassword(signInDto.email);
    if (!userWithPassword) throw new NotFoundException('User not found');
    if (!compare(signInDto.password, userWithPassword?.password ?? "")) throw new UnauthorizedException('Contraseña no válida.');
    // const { accessToken, refreshToken } = await this.authService.generateAccessAndRefreshToken(request, userWithPassword);
    const { password, ...user } = userWithPassword;
    await this.userService.updateLastLogin(userWithPassword);
    return { ok: true, data: { user } };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('google-auth')
  async signInWithGoogle(
    @Body() logInWithGoogleDto: SignInWithGoogleDto,
    @Req()
    request: Request,
  ) {
    const googleUser: TokenPayload = await this.authService.getUserWithGoogleTokens(logInWithGoogleDto.accessToken);
    if (!googleUser.email) throw new BadRequestException('Access token no valido');
    let user = await this.userService.userExistByEmail(googleUser.email);

    if (!user) {
      const userCreated = await this.userService.createWithGoogle(googleUser);
      user = userCreated;
    }
    const userUpdated = await this.userService.editProfile(user, googleUser);

    // const { accessToken, refreshToken } = await this.authService.generateAccessAndRefreshToken(request, userUpdated);
    await this.userService.updateLastLogin(user);
    return { ok: true, data: { user: userUpdated } };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh-accesstoken')
  async refreshAcessToken(@Body() refreshTokenDto: RefreshTokenDto, @GetSessionId() sessionId: string): Promise<ApiResponse<{ accessToken: string, refreshToken: string }>> {
    await this.sessionService.removeSession(sessionId);

    const newTokens = await this.authService.validateRefreshToken(refreshTokenDto.refreshToken);
    if (!newTokens) throw new UnauthorizedException({ message: 'Refresh token no valido', });

    const session = await this.sessionService.findOne(newTokens.sessionId);
    if (!session) throw new UnauthorizedException({ message: 'Unauthorized' });

    const { accessToken, refreshToken } = await this.authService.refreshAccessToken({ user: newTokens.user, sessionId: newTokens.sessionId });
    return { ok: true, data: { accessToken, refreshToken } };
  }

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
    if (user.emailCode !== dto.emailCode) throw new NotFoundException('Email code not valid');

    const updatedUser = await this.userService.verifyEmailAndResetEmailCode(user);
    this.userService.editProfile(user, updatedUser);
    return { ok: true, data: updatedUser };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('request-password-reset')
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto): Promise<ApiResponse<void>> {
    const user = await this.userService.getUserWithUnselectableFields(requestPasswordResetDto.email);
    if (!user) throw new NotFoundException('User not found');
    this.userService.generateResetCodeAndUpdateUser(user);
    this.userService.sendEmailVerificationCode(user);
    return { ok: true, };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Req() req: Request,
    @Body() dto: ResetPasswordDto,
  ) {
    const existingUser = await this.userService.getResssetCodeAndPassword(dto.email);
    if (!existingUser) throw new NotFoundException('User not found');
    if (existingUser.emailCode !== dto.resetCode) throw new UnauthorizedException('Invalid reset code');
    const codeAge = Date.now() - new Date(existingUser.emailCodeCreatedAt).getTime();
    if (codeAge > 3600000 * 24) throw new UnauthorizedException('Reset code has expired');

    const updatedUserData = await this.userService.changePassword(existingUser, dto.newPassword);

    // const { accessToken, refreshToken } = await this.authService.generateAccessAndRefreshToken(req, updatedUserData);
    return { ok: true, message: 'Password updated successfully', data: { user: updatedUserData } };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user.id);
  }

  @Post('refresh')
  @UseGuards(RefreshAuthGuard)
  async refreshToken(@Req() req) {
    return this.authService.refreshToken(req.user.sessionId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@GetSessionId() sessionId: string) {
    return this.authService.logout(sessionId);
  }
}
