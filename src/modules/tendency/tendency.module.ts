import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tendency } from '@modules/tendency/entity/Tendency.entity';
import { TendencyService } from './tendency.service';
import { TendencyController } from './tendency.controller';
import { Establishment } from '@models/Establishment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tendency, Establishment])],
  providers: [TendencyService],
  exports: [TendencyService],
  controllers: [TendencyController],
})
export class TendencyModule {}
