import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../models/User.entity';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Session } from '@models/Session.entity';
import { UserController } from './user.controller';
import { SessionService } from '../auth/session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RefreshJwtStrategy } from '../auth/strategies/refresh.strategy';
import { RefreshAuthGuard } from '../auth/guards/refresh-auth.guard';
import jwtConfig from 'src/config/jwt.config';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [
    UserService,
    AuthService,
    JwtService,
    SessionService,
    JwtAuthGuard,
    RefreshJwtStrategy,
    RefreshAuthGuard,
  ],
  controllers: [UserController],
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    forwardRef(() => AuthModule),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
  ],
  exports: [UserService],
})
export class UserModule {}
