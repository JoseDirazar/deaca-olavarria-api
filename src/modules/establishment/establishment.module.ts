import { Module } from '@nestjs/common';
import { EstablishmentController } from './establishment.controller';
import { EstablishmentService } from './establishment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Establishment } from '@models/Establishment.entity';
import { Image } from '@models/Image.entity';
import { AuthModule } from '@modules/iam/auth/auth.module';
import { UserModule } from '@modules/iam/user/user.module';
import { UserService } from '@modules/iam/user/user.service';
import { User } from '@models/User.entity';
import { EmailModule } from '@modules/email/email.module';
import { EmailService } from '@modules/email/email.service';
import { Review } from '@models/Review.entity';

@Module({
  controllers: [EstablishmentController],
  providers: [EstablishmentService, UserService, EmailService],
  imports: [
    TypeOrmModule.forFeature([Establishment, Image, User, Review]),
    AuthModule,
    UserModule,
    EmailModule,
  ],
})
export class EstablishmentModule {}
