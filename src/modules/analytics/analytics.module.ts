import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { Analytics } from '@modules/analytics/entity/Analytics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Analytics])],
  providers: [AnalyticsService],
  exports: [AnalyticsService], // para usarlo en establishment
})
export class AnalyticsModule {}
