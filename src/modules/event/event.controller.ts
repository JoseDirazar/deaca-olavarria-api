import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventDto } from './dto/event.dto';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import {
  UploadFilesInterceptor,
  UploadInterceptor,
} from 'src/infrastructure/interceptors/upload.interceptor';
import { EVENT_IMAGE_PATH, EVENT_IMAGES_PATH } from 'src/infrastructure/utils/upload-paths';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { EventService } from './event.service';

@Controller('event')
export class EventController {
  constructor(private readonly eventsService: EventService) {}

  @Get()
  async getEvents() {
    return { data: await this.eventsService.getEvents() };
  }

  @Get(':id')
  async getEventById(@Param('id') id: string) {
    return { data: await this.eventsService.getEventById(id) };
  }

  @Post()
  async createEvent(@Body() eventDto: EventDto) {
    const event = await this.eventsService.createEvent(eventDto);
    return { data: event, message: `Evento ${event.name} creado exitosamente` };
  }

  @Put(':id')
  async updateEvent(@Param('id') id: string, @Body() eventDto: EventDto) {
    const event = await this.eventsService.getEventById(id);
    if (!event) {
      throw new BadRequestException('Evento no encontrado');
    }
    return {
      data: await this.eventsService.updateEvent(event, eventDto),
      message: `Evento ${event.name} actualizado exitosamente`,
    };
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: string) {
    const event = await this.eventsService.getEventById(id);
    if (!event) {
      throw new BadRequestException('Evento no encontrado');
    }
    return {
      data: await this.eventsService.deleteEvent(event),
      message: `Evento ${event.name} eliminado exitosamente`,
    };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Post(':id/image')
  @UseInterceptors(UploadInterceptor(EVENT_IMAGE_PATH, ['jpg', 'png', 'jpeg', 'webp']))
  async uploadEstablishmentAvatar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se envio un archivo');

    const event = await this.eventsService.getEventById(id);
    if (!event) throw new NotFoundException('Evento no encontrado');

    const updatedEvent = await this.eventsService.updateImage(event, file.path);
    return { data: updatedEvent };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Post(':id/images')
  @UseInterceptors(UploadFilesInterceptor(EVENT_IMAGES_PATH, ['jpg', 'png', 'jpeg', 'webp']))
  async uploadEstablishmentImages(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('No se envio un archivo');

    const event = await this.eventsService.getEventById(id);
    if (!event) throw new NotFoundException('Evento no encontrado');

    const updatedEvent = await this.eventsService.uploadImages(
      event,
      files.map((file) => file.path),
    );
    return { data: updatedEvent };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Delete(':id/image/:imageId')
  async deleteEventImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
  ) {
    const event = await this.eventsService.getEventById(id);
    if (!event) throw new NotFoundException('Evento no encontrado');
    return { data: await this.eventsService.deleteImage(event, imageId) };
  }
}
