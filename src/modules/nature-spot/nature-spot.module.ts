import { Module } from '@nestjs/common';
import { NatureSpotController } from './nature-spot.controller';
import { NatureSpotService } from './nature-spot.service';
import { UploadService } from '@modules/upload/upload.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NatureSpot } from '@models/NatureSpot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NatureSpot, Image])],
  controllers: [NatureSpotController],
  providers: [NatureSpotService, UploadService],
})
export class NatureSpotModule {}
