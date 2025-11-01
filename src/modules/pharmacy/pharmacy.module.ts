import { Module } from '@nestjs/common';
import { FarmaciasController } from './pharmacy.controller';
import { FarmaciasService } from './pharmacy.service';

@Module({
  controllers: [FarmaciasController],
  providers: [FarmaciasService],
})
export class FarmaciasModule {}
