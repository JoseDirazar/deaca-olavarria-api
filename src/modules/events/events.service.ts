import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from '@models/Event.entity';
import { Repository } from 'typeorm';
import { EventDto } from './dto/event.dto';
import { UploadService } from '@modules/upload/upload.service';
import { Image } from '@models/Image.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly eventRepository: Repository<Event>,
    @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
    private readonly uploadService: UploadService,
  ) {}

  async getEvents() {
    return await this.eventRepository.find();
  }

  async getEventById(id: string) {
    return await this.eventRepository.findOne({ where: { id } });
  }

  async createEvent(eventDto: EventDto) {
    const event = this.eventRepository.create(eventDto);
    return await this.eventRepository.save(event);
  }

  async updateEvent(event: Event, eventDto: EventDto) {
    return await this.eventRepository.save({ ...event, ...eventDto });
  }

  async deleteEvent(event: Event) {
    return await this.eventRepository.remove(event);
  }

  async updateImage(event: Event, newAvatarFileName: string) {
    if (event.image) {
      const oldAvatarPath = this.uploadService.resolveUploadPath('event', 'logo', event.image);
      await this.uploadService.deleteFileIfExists(oldAvatarPath);
    }
    const normalizedPath = await this.uploadService.normalizeImage(newAvatarFileName);
    event.image = normalizedPath;
    return await this.eventRepository.save(event);
  }

  async uploadImages(event: Event, fileNames: string[]) {
    const images = fileNames.map((fileName) => {
      const image = this.imageRepository.create({
        fileName,
        event,
      });
      return image;
    });

    await this.imageRepository.save(images);
    return await this.eventRepository.findOne({
      where: { id: event.id },
      relations: ['images'],
    });
  }
}
