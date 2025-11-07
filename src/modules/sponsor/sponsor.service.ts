import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Sponsor } from './entity/sponsor.entity';
import { Repository } from 'typeorm';
import { UploadService } from '@modules/upload/upload.service';

@Injectable()
export class SponsorService {
  constructor(
    @InjectRepository(Sponsor) private readonly sponsorRepository: Repository<Sponsor>,
    private readonly uploadService: UploadService,
  ) {}

  async findAll() {
    return this.sponsorRepository.find();
  }

  async findOne(id: number) {
    return this.sponsorRepository.findOneBy({ id });
  }

  async create(name: string) {
    const sponsor = this.sponsorRepository.create({ name });
    return this.sponsorRepository.save(sponsor);
  }

  async update(name: string, id: number) {
    const existingSponsor = await this.findOne(id);
    if (!existingSponsor) {
      throw new ConflictException('Sponsor no encontrado');
    }
    existingSponsor.name = name;
    return this.sponsorRepository.save(existingSponsor);
  }

  async delete(id: number) {
    const sponsor = await this.findOne(id);
    if (!sponsor) {
      throw new ConflictException('Sponsor no encontrado');
    }
    return this.sponsorRepository.remove(sponsor);
  }

  async uploadImage(id: number, file: Express.Multer.File) {
    const sponsor = await this.findOne(id);
    if (!sponsor) {
      throw new ConflictException('Sponsor no encontrado');
    }
    if (sponsor.image) {
      const oldAvatarPath = this.uploadService.resolveUploadPath('sponsor', sponsor.image);
      await this.uploadService.deleteFileIfExists(oldAvatarPath);
    }
    const normalizedPath = await this.uploadService.normalizeImage(file.path);
    sponsor.image = normalizedPath;
    return await this.sponsorRepository.save(sponsor);
  }
}
