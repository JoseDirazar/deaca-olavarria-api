import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from '@models/Event.entity';
import { Repository } from 'typeorm';
import { EventDto } from './dto/event.dto';
import { UploadService } from '@modules/upload/upload.service';
import { Image } from '@models/Image.entity';
import { join } from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event) private readonly eventRepository: Repository<Event>,
    @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
    private readonly uploadService: UploadService,
  ) {}

  async getEvents() {
    return await this.eventRepository.find();
  }

  async getEventById(id: string) {
    return await this.eventRepository.findOne({ where: { id }, relations: ['gallery'] });
  }

  async createEvent(eventDto: EventDto) {
    const event = this.eventRepository.create(eventDto);
    return await this.eventRepository.save(event);
  }

  async updateEvent(event: Event, eventDto: EventDto) {
    return await this.eventRepository.save({ ...event, ...eventDto });
  }

  async deleteEvent(event: Event) {
    if (event.gallery && event.gallery.length > 0) {
      for (const image of event.gallery) {
        try {
          const imagePath = join('./upload/user/event/', image.fileName);
          await fs.unlink(imagePath);
        } catch (error) {
          console.error(`Error al eliminar imagen ${image.fileName}:`, error);
        }
      }
      await this.imageRepository.remove(event.gallery);
    }

    if (event.image) {
      try {
        const imagePath = join('./upload/user/event/logo/', event.image);
        await fs.unlink(imagePath);
      } catch (error) {
        console.error(`Error al eliminar avatar ${event.image}:`, error);
      }
    }

    await this.eventRepository.remove(event);
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
    if (!fileNames) throw new Error('No se proporcionaron archivos');
    let normalizedPaths = await Promise.all(
      fileNames.map(async (fileName) => this.uploadService.normalizeImage(fileName)),
    );

    if (!normalizedPaths) return;
    const images = normalizedPaths.map((fileName) => {
      const image = this.imageRepository.create({
        fileName,
        event,
      });
      return image;
    });

    await this.imageRepository.save(images);
    return await this.eventRepository.findOne({
      where: { id: event.id },
      relations: ['gallery'],
    });
  }

  async deleteImage(event: Event, imageId: string) {
    const image = await this.imageRepository.findOne({
      where: { id: imageId },
      relations: ['event'],
    });
    if (!image) throw new NotFoundException('Imagen no encontrada');
    if (image.event.id !== event.id)
      throw new UnauthorizedException('No tienes permiso para eliminar esta imagen');
    const imagePath = this.uploadService.resolveUploadPath('event', image.fileName);
    await this.uploadService.deleteFileIfExists(imagePath);
    return await this.imageRepository.remove(image);
  }
}
