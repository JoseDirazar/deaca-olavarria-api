import { NatureSpot } from '@models/NatureSpot.entity';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatureSpotDto } from './dto/nature-spot.dto';
import { Image } from '@models/Image.entity';
import { UploadService } from '@modules/upload/upload.service';
import { join } from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class NatureSpotService {
  constructor(
    @InjectRepository(NatureSpot) private readonly natureSpotRepository: Repository<NatureSpot>,
    @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
    private readonly uploadService: UploadService,
  ) {}

  async getNatureSpots(): Promise<NatureSpot[]> {
    return this.natureSpotRepository.find();
  }

  async getNatureSpotById(id: string): Promise<NatureSpot | null> {
    return this.natureSpotRepository.findOne({ where: { id }, relations: ['gallery'] });
  }

  async createNatureSpot(natureSpotDto: NatureSpotDto): Promise<NatureSpot> {
    const natureSpot = this.natureSpotRepository.create(natureSpotDto);
    return this.natureSpotRepository.save(natureSpot);
  }

  async updateNatureSpot(
    natureSpot: NatureSpot,
    natureSpotDto: NatureSpotDto,
  ): Promise<NatureSpot> {
    return this.natureSpotRepository.save({ ...natureSpot, ...natureSpotDto });
  }

  async deleteNatureSpot(natureSpot: NatureSpot): Promise<void> {
    if (natureSpot.gallery && natureSpot.gallery.length > 0) {
      for (const image of natureSpot.gallery) {
        try {
          const imagePath = join('./upload/user/nature-spot/', image.fileName);
          await fs.unlink(imagePath);
        } catch (error) {
          console.error(`Error al eliminar imagen ${image.fileName}:`, error);
        }
      }
      await this.imageRepository.remove(natureSpot.gallery);
    }

    if (natureSpot.image) {
      try {
        const imagePath = join('./upload/user/nature-spot/logo/', natureSpot.image);
        await fs.unlink(imagePath);
      } catch (error) {
        console.error(`Error al eliminar avatar ${natureSpot.image}:`, error);
      }
    }

    await this.natureSpotRepository.remove(natureSpot);
  }

  async updateImage(natureSpot: NatureSpot, newAvatarFileName: string) {
    if (natureSpot.image) {
      const oldAvatarPath = this.uploadService.resolveUploadPath(
        'nature-spot',
        'logo',
        natureSpot.image,
      );
      await this.uploadService.deleteFileIfExists(oldAvatarPath);
    }
    const normalizedPath = await this.uploadService.normalizeImage(newAvatarFileName);
    natureSpot.image = normalizedPath;
    return await this.natureSpotRepository.save(natureSpot);
  }

  async uploadImages(natureSpot: NatureSpot, fileNames: string[]) {
    if (!fileNames) throw new Error('No se proporcionaron archivos');
    let normalizedPaths = await Promise.all(
      fileNames.map(async (fileName) => this.uploadService.normalizeImage(fileName)),
    );

    if (!normalizedPaths) return;
    const images = normalizedPaths.map((fileName) => {
      const image = this.imageRepository.create({
        fileName,
        natureSpot,
      });
      return image;
    });

    await this.imageRepository.save(images);
    return await this.natureSpotRepository.findOne({
      where: { id: natureSpot.id },
      relations: ['gallery'],
    });
  }

  async deleteImage(natureSpot: NatureSpot, imageId: string) {
    const image = await this.imageRepository.findOne({
      where: { id: imageId },
      relations: ['natureSpot'],
    });
    if (!image) throw new NotFoundException('Imagen no encontrada');
    if (image.natureSpot.id !== natureSpot.id)
      throw new UnauthorizedException('No tienes permiso para eliminar esta imagen');
    const imagePath = this.uploadService.resolveUploadPath('nature-spot', image.fileName);
    await this.uploadService.deleteFileIfExists(imagePath);
    return await this.imageRepository.remove(image);
  }
}
