import { BadRequestException, Controller, Get, NotFoundException, Param, Post, Query, UnsupportedMediaTypeException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { EstablishmentService } from './establishment.service';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { allowedFileExtensions } from '@modules/iam/user/user.controller';
import { diskStorage } from 'multer';
import * as uuid from 'uuid';

@Controller('establishment')
export class EstablishmentController {
  constructor(private readonly establishmentService: EstablishmentService) { }

  @Get('')
  async getPaginatedEstablishments(@Query() params: EstablishmentsPaginationQueryParamsDto) {
    const establishments = await this.establishmentService.getPaginatedEstablishments(params);
    if (!establishments) return new NotFoundException('No se encontraron establecimientos');

    return establishments;
  }

  @Get(':id')
  async getEstablishmentById(@Param('id') id: string) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) return new NotFoundException('No se encontro el establecimiento');

    return establishment;
  }


  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter(req, file, callback) {
        if (
          !allowedFileExtensions.includes(
            file.originalname.split('.').pop() ?? '',
          )
        ) {
          console.error('Invalid file type:', file.originalname);
          return callback(new UnsupportedMediaTypeException(), false);
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: './uploads/establishments/',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuid.v4();
          const extension = file.originalname.split('.').pop();
          const uniqueFilename = `${uniqueSuffix}.${extension}`;
          callback(null, uniqueFilename);
        },
      }),
    }),
  )
  async uploadImages(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      if (!image) {
        console.error('No file received in uploadImages');
        throw new BadRequestException('Archivo requerido');
      }

      const result = await this.establishmentService.uploadImages(id, image);
      return result;
    } catch (error) {
      console.error('Error in uploadImages:', error);
      throw error;
    }
  }
}
