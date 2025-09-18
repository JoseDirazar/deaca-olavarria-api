import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger';
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
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiBody({ type: SignUpDto })
  @ApiOperation({ summary: 'Crea el user con email y password' })
  @Post('sign-up')
  async createUser(@Req() req: Request, @Body() dto: SignUpDto) {
    const serviceResponse = await this.authService.signUp(req, dto);

    return serviceResponse;
  }

  @Public()
  @ApiBody({ type: LogInDto })
  @ApiOperation({ summary: 'Crea la session del usuario' })
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
  @ApiBody({ type: LogInWithGoogleDto })
  @ApiOperation({ summary: 'Crea la session del usuario' })
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
  @ApiBody({ type: RefreshTokenDto })
  @ApiOperation({ summary: 'Crea la session del usuario' })
  @Post('/refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const token = await this.authService.refreshToken(refreshTokenDto);
    return { ok: true, token };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtiene tu datos de usuario' })
  @Post('/log-out')
  getProfile(@GetUser() user: User, @GetSessionId() sessionId: number) {
    return { ok: true, user, sessionId };
  }
  //router.post('/log-out', auth, logOut);

  //router.post('', refreshToken);
}
