import { NatureSpot } from '@models/NatureSpot.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatureSpotDto } from './dto/nature-spot.dto';
import { Image } from '@models/Image.entity';
import { UploadService } from '@modules/upload/upload.service';

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
    return this.natureSpotRepository.findOne({ where: { id } });
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
    const images = fileNames.map((fileName) => {
      const image = this.imageRepository.create({
        fileName,
        natureSpot,
      });
      return image;
    });

    await this.imageRepository.save(images);
    return await this.natureSpotRepository.findOne({
      where: { id: natureSpot.id },
      relations: ['images'],
    });
  }
}
