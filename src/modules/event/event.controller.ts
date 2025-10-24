import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Param,
  UseGuards,
  Put,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventService } from './event.service';
import { EventDto } from './dto/event.dto';
import { Event } from '@models/Event.entity';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async createEvent(@Body() eventDto: EventDto): Promise<Event | null> {
    const event = await this.eventService.createEvent(eventDto);
    if (!event) throw new BadRequestException('No se pudo crear el evento');
    return event;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async getEvents(): Promise<Event[]> {
    return this.eventService.getEvents();
  }

  @Get('active')
  async getActiveEvents(): Promise<Event[]> {
    return this.eventService.getActiveEvents();
  }

  @Get(':id')
  async getEventById(@Param('id', new ParseUUIDPipe()) id: string): Promise<Event | null> {
    return this.eventService.getEventById(id);
  }

  @Put(':id')
  async updateEvent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() eventDto: EventDto,
  ): Promise<Event | null> {
    return this.eventService.updateEvent(id, eventDto);
  }

  @Delete(':id')
  async deleteEvent(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.eventService.deleteEvent(id);
  }
}
