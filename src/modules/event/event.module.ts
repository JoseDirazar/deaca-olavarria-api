import { Event } from '@models/Event.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { ActiveEventService } from './cron/active-event.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), ScheduleModule],
  providers: [EventService, EventController, ActiveEventService],
  exports: [EventService],
})
export class EventModule {}
