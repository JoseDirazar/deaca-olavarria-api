import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '@models/Event.entity';
import { Image } from '@models/Image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Image])],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
