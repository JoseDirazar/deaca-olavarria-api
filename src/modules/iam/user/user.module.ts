import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../models/User.entity';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Session } from '@models/Session.entity';
import { UserController } from './user.controller';
import { SessionService } from '../auth/session.service';
import { EmailService } from '@modules/email/email.service';

@Module({
  providers: [UserService, AuthService, JwtService, SessionService, EmailService],
  controllers: [UserController],
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    forwardRef(() => AuthModule),
  ],
  exports: [UserService],
})
export class UserModule { }
