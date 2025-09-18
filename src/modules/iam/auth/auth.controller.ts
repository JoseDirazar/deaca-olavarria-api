import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { LogInDto } from './dto/log-in.dto';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '@models/User.entity';
import { LogInWithGoogleDto } from './dto/log-in-with-google.dto';
import { Public } from 'src/infrastructure/decorators/public-route.decorator';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { GetSessionId } from 'src/infrastructure/decorators/get-session-id.decorator';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  async createUser(@Req() req: Request, @Body() dto: SignUpDto) {
    const serviceResponse = await this.authService.signUp(req, dto);

    return serviceResponse;
  }

  @Public()
  @Post('/log-in')
  async logIn(
    @Body() logInDto: LogInDto,
    @Req()
    request,
  ) {
    const userResponse = await this.authService.logIn(request, logInDto);
    return userResponse;
  }

  @Public()
  @Post('/log-in-with-google')
  async logInWithGoogle(
    @Body() logInWithGoogleDto: LogInWithGoogleDto,
    @Req()
    request,
  ) {
    const userResponse = await this.authService.logInWithGoogle(request, logInWithGoogleDto);
    return userResponse;
  }

  @Public()
  @Post('/refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const token = await this.authService.refreshToken(refreshTokenDto);
    return { ok: true, token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/log-out')
  getProfile(@GetUser() user: User, @GetSessionId() sessionId: number) {
    return { ok: true, user, sessionId };
  }
  //router.post('/log-out', auth, logOut);

  //router.post('', refreshToken);
}
