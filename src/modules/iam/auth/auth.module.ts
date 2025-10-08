import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '@models/Session.entity';
import { SessionService } from './session.service';
import { UserService } from '@modules/iam/user/user.service';
import { User } from '@models/User.entity';
import { EmailService } from '@modules/email/email.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import jwtConfig from 'src/config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { SessionCleanupService } from './cron/session-cleanup-service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([User, Session]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    ScheduleModule.forRoot(),
  ],
  providers: [UserService, AuthService, SessionService, EmailService, JwtStrategy, RolesGuard, LocalStrategy, RefreshJwtStrategy, RefreshAuthGuard, JwtAuthGuard, SessionCleanupService],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule { }
