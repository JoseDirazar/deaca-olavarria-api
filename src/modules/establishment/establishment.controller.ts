import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, NotFoundException, Param, Post, Put, Query, UnsupportedMediaTypeException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { EstablishmentService } from './establishment.service';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { allowedFileExtensions } from '@modules/iam/user/user.controller';
import { diskStorage } from 'multer';
import * as uuid from 'uuid';
import { EstablishmentDto } from './dto/establishment.dto';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { UserService } from '@modules/iam/user/user.service';
import { RolesAllowed } from '@modules/iam/auth/decorators/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';

@Controller('establishment')
export class EstablishmentController {
  constructor(private readonly establishmentService: EstablishmentService, private readonly userService: UserService) { }

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
  @RolesAllowed(Roles.ADMIN)
  @Post('')
  async createEstablishment(@Body('establishment') establishmentDto: EstablishmentDto, @Body('userId') userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado, el establecimiento debe pertenecer a un usuario');
    }
    const establishment = await this.establishmentService.createEstablishment(establishmentDto, user);
    if (!establishment) return new NotFoundException('No se pudo crear el establecimiento');

    return establishment;
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
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

  @Put('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter(req, file, callback) {
        if (
          !allowedFileExtensions.includes(
            file.originalname.split('.').pop() ?? '',
          )
        ) {
          return callback(new UnsupportedMediaTypeException(), false);
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: './uploads/user/avatars/',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuid.v4();
          const extension = file.originalname.split('.').pop();
          const uniqueFilename = `${uniqueSuffix}.${extension}`;
          callback(null, uniqueFilename);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
    @GetUser('id') userId: string,
  ) {
    if (!file)
      throw new HttpException('a file is required', HttpStatus.BAD_REQUEST);

    const newAvatar = file.filename;
    const usersaved = await this.userService.changeAvatar(userId, newAvatar);

    return { ok: true, user: usersaved };
  }
}
