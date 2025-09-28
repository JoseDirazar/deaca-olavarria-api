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
import { Patch, Delete } from '@nestjs/common';
import { User } from '@models/User.entity';
import { UUIDParamDto } from 'src/infrastructure/dto/uuid-param.dto';

@Controller('establishment')
export class EstablishmentController {
  constructor(private readonly establishmentService: EstablishmentService, private readonly userService: UserService) { }

  @Get('')
  async getPaginatedEstablishments(@Query() params: EstablishmentsPaginationQueryParamsDto) {
    const establishments = await this.establishmentService.getPaginatedEstablishments(params);
    if (!establishments) return new NotFoundException('No se encontraron establecimientos');

    return establishments;
  }

  // Owner list my establishments
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Get('mine')
  async getMyEstablishments(@GetUser('id') userId: string) {
    const items = await this.establishmentService.getEstablishmentsByUser(userId);
    return { data: items };
  }

  @Get(':id')
  async getEstablishmentById(@Param('id') { id }: UUIDParamDto) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) return new NotFoundException('No se encontro el establecimiento');

    return establishment;
  }

  // Owner create establishment for self
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN, Roles.BUSINESS_OWNER)
  @Post('mine')
  async createMyEstablishment(@Body() establishmentDto: EstablishmentDto, @GetUser() user: User) {
    const establishment = await this.establishmentService.createEstablishment(establishmentDto, user);
    if (!establishment) return new NotFoundException('No se pudo crear el establecimiento');
    return establishment;
  }



  // Owner update my establishment
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Put(':id')
  async updateMyEstablishment(@Param('id') id: string, @Body() establishmentDto: Partial<EstablishmentDto>) {
    const updated = await this.establishmentService.updateEstablishment(id, establishmentDto);
    return updated;
  }

  // Owner delete my establishment
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Delete(':id')
  async deleteMyEstablishment(@Param('id') id: string) {
    return await this.establishmentService.deleteEstablishment(id);
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

  // Admin verify toggle
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Patch(':id/verify')
  async verifyEstablishment(@Param('id') id: string, @Body('verified') verified: boolean) {
    const updated = await this.establishmentService.setVerified(id, verified);
    return updated;
  }

  // Upload establishment avatar (owner)
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Post(':id/avatar')
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
        destination: './uploads/establishments/avatars/',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuid.v4();
          const extension = file.originalname.split('.').pop();
          const uniqueFilename = `${uniqueSuffix}.${extension}`;
          callback(null, uniqueFilename);
        },
      }),
    }),
  )
  async uploadEstablishmentAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file)
      throw new HttpException('a file is required', HttpStatus.BAD_REQUEST);
    const updated = await this.establishmentService.updateEstablishment(id, { avatar: file.filename } as any);
    return { ok: true, establishment: updated };
  }
}

