import { Module } from '@nestjs/common';
import { SponsorController } from './sponsor.controller';
import { SponsorService } from './sponsor.service';
import { Sponsor } from './entity/sponsor.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Sponsor])],
  controllers: [SponsorController],
  providers: [SponsorService],
})
export class SponsorModule {}
