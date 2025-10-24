import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@models/User.entity';
import { Session } from '@models/Session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session]), AuthModule, UserModule],
  exports: [AuthModule, UserModule],
})
export class IamModule {}
