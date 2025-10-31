import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  Put,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  UploadedFile,
  NotFoundException,
  UploadedFiles,
} from '@nestjs/common';
import { NatureSpotService } from './nature-spot.service';
import { NatureSpotDto } from './dto/nature-spot.dto';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import {
  UploadFilesInterceptor,
  UploadInterceptor,
} from 'src/infrastructure/interceptors/upload.interceptor';
import { NATURE_SPOT_IMAGE_PATH } from 'src/infrastructure/utils/upload-paths';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';

@Controller('nature-spot')
export class NatureSpotController {
  constructor(private readonly natureSpotService: NatureSpotService) {}

  @Get()
  async getNatureSpots() {
    return { data: await this.natureSpotService.getNatureSpots() };
  }

  @Get(':id')
  async getNatureSpotById(@Param('id') id: string) {
    return { data: await this.natureSpotService.getNatureSpotById(id) };
  }

  @Post()
  async createNatureSpot(@Body() natureSpotDto: NatureSpotDto) {
    const createdNatureSpot = await this.natureSpotService.createNatureSpot(natureSpotDto);
    return {
      data: createdNatureSpot,
      message: `Paseo turistico ${createdNatureSpot.name} creado exitosamente`,
    };
  }

  @Put(':id')
  async updateNatureSpot(@Param('id') id: string, @Body() natureSpotDto: NatureSpotDto) {
    const existingNatureSpot = await this.natureSpotService.getNatureSpotById(id);
    if (!existingNatureSpot) {
      throw new BadRequestException('Paseo turistico no encontrado');
    }
    const updatedNatureSpot = await this.natureSpotService.updateNatureSpot(
      existingNatureSpot,
      natureSpotDto,
    );
    return {
      data: updatedNatureSpot,
      message: `Paseo turistico ${updatedNatureSpot.name} actualizado exitosamente`,
    };
  }

  @Delete(':id')
  async deleteNatureSpot(@Param('id') id: string) {
    const existingNatureSpot = await this.natureSpotService.getNatureSpotById(id);
    if (!existingNatureSpot) {
      throw new BadRequestException('Paseo turistico no encontrado');
    }

    return {
      data: await this.natureSpotService.deleteNatureSpot(existingNatureSpot),
      message: `Paseo turistico ${existingNatureSpot.name} eliminado exitosamente`,
    };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Post(':id/image')
  @UseInterceptors(UploadInterceptor(NATURE_SPOT_IMAGE_PATH, ['jpg', 'png', 'jpeg', 'webp']))
  async uploadEstablishmentAvatar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se envio un archivo');

    const natureSpot = await this.natureSpotService.getNatureSpotById(id);
    if (!natureSpot) throw new NotFoundException('Paseo turistico no encontrado');

    const updatedNatureSpot = await this.natureSpotService.updateImage(natureSpot, file.path);
    return { data: updatedNatureSpot };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Post(':id/images')
  @UseInterceptors(UploadFilesInterceptor(NATURE_SPOT_IMAGE_PATH, ['jpg', 'png', 'jpeg', 'webp']))
  async uploadEstablishmentImages(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files.length) throw new BadRequestException('No se envio un archivo');

    const natureSpot = await this.natureSpotService.getNatureSpotById(id);
    if (!natureSpot) throw new NotFoundException('Paseo turistico no encontrado');

    const updatedNatureSpot = await this.natureSpotService.uploadImages(
      natureSpot,
      files.map((file) => file.path),
    );
    return { data: updatedNatureSpot };
  }
}
