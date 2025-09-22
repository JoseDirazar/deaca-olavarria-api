import { Module } from '@nestjs/common';
import { EstablishmentController } from './establishment.controller';
import { EstablishmentService } from './establishment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Establishment } from '@models/Establishment.entity';
import { Image } from '@models/Image.entity';
import { AuthModule } from '@modules/iam/auth/auth.module';

@Module({
  controllers: [EstablishmentController],
  providers: [EstablishmentService],
  imports: [TypeOrmModule.forFeature([Establishment, Image]), AuthModule],
})
export class EstablishmentModule { }
