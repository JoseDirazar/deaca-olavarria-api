import { NatureSpot } from '@models/NatureSpot.entity';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatureSpotDto } from './dto/nature-spot.dto';
import { Image } from '@models/Image.entity';
import { UploadService } from '@modules/upload/upload.service';
import * as path from 'path';
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
          const imagePath = path.join('./upload/user/nature-spot/', image.fileName);
          await fs.unlink(imagePath);
        } catch (error) {
          console.error(`Error al eliminar imagen ${image.fileName}:`, error);
        }
      }
      await this.imageRepository.remove(natureSpot.gallery);
    }

    if (natureSpot.image) {
      try {
        const imagePath = path.join('./upload/user/nature-spot/logo/', natureSpot.image);
        await fs.unlink(imagePath);
      } catch (error) {
        console.error(`Error al eliminar avatar ${natureSpot.image}:`, error);
      }
    }

    await this.natureSpotRepository.remove(natureSpot);
  }

  async updateImage(natureSpot: NatureSpot, newAvatarFilePath: string) {
    console.log('updateImage called with:', {
      natureSpotId: natureSpot.id,
      currentImage: natureSpot.image,
      newAvatarFilePath,
    });

    try {
      // Delete old image if it exists
      if (natureSpot.image) {
        const oldAvatarPath = this.uploadService.resolveUploadPath(
          'nature-spot/logo',
          natureSpot.image,
        );
        console.log('Deleting old image at path:', oldAvatarPath);
        await this.uploadService.deleteFileIfExists(oldAvatarPath);
      }

      // Get the file name from the path
      const fileName = path.basename(newAvatarFilePath);
      const fileExt = path.extname(fileName);
      const baseName = path.basename(fileName, fileExt);

      // Create the final path where the file should be stored
      const finalPath = this.uploadService.resolveUploadPath('nature-spot/logo', fileName);

      // Ensure the target directory exists
      const targetDir = path.dirname(finalPath);
      try {
        await fs.access(targetDir);
      } catch {
        await fs.mkdir(targetDir, { recursive: true });
      }

      // Move the file to the final location
      await fs.rename(newAvatarFilePath, finalPath);

      // Normalize the image (convert to webp)
      console.log('Normalizing new image:', finalPath);
      const normalizedFileName = await this.uploadService.normalizeImage(finalPath);
      console.log('Image normalized, new file name:', normalizedFileName);

      // Update the nature spot with the new image path
      natureSpot.image = normalizedFileName;
      console.log('Saving nature spot with new image...');
      const updated = await this.natureSpotRepository.save(natureSpot);
      console.log('Nature spot updated successfully');

      return updated;
    } catch (error) {
      console.error('Error in updateImage:', error);
      // Clean up the uploaded file if there was an error
      try {
        await this.uploadService.deleteFileIfExists(newAvatarFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file after error:', cleanupError);
      }
      throw error; // Re-throw to be handled by the controller
    }
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
