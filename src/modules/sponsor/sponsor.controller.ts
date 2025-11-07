import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SponsorService } from './sponsor.service';
import {
  UploadFilesInterceptor,
  UploadInterceptor,
} from 'src/infrastructure/interceptors/upload.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { SPONSOR_IMAGE_PATH } from 'src/infrastructure/utils/upload-paths';

@Controller('sponsor')
export class SponsorController {
  constructor(private readonly sponsorService: SponsorService) {}

  @Get()
  async findAll() {
    return { data: await this.sponsorService.findAll() };
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return { data: await this.sponsorService.findOne(id) };
  }

  @Post()
  async create(@Body() { name }: { name: string }) {
    return {
      data: await this.sponsorService.create(name),
      message: 'Sponsor created successfully',
    };
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() { name }: { name: string }) {
    return {
      data: await this.sponsorService.update(name, id),
      message: 'Sponsor updated successfully',
    };
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    this.sponsorService.delete(id);
    return { message: 'Sponsor deleted successfully' };
  }

  @Post(':id/image')
  @UseInterceptors(UploadInterceptor(SPONSOR_IMAGE_PATH, ['jpg', 'png', 'jpeg', 'webp']))
  async uploadImage(@Param('id') id: number, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException({ message: 'No se envio un archivo' });

    const updatedSponsor = await this.sponsorService.uploadImage(id, file);
    return { data: updatedSponsor };
  }
}
