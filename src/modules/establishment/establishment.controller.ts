import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Put, Query, UnsupportedMediaTypeException, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { EstablishmentService } from './establishment.service';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { allowedFileExtensions } from '@modules/iam/user/user.controller';
import { diskStorage } from 'multer';
import * as uuid from 'uuid';
import { EstablishmentDto } from './dto/establishment.dto';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { RolesAllowed } from '@modules/iam/auth/decorators/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { Patch, Delete } from '@nestjs/common';
import { User } from '@models/User.entity';
import { UUIDParamDto } from 'src/infrastructure/dto/uuid-param.dto';
import { ApiResponse } from 'src/infrastructure/types/interfaces/api-response.interface';
import { Establishment } from '@models/Establishment.entity';
import { Image } from '@models/Image.entity';

@Controller('establishment')
export class EstablishmentController {
  constructor(
    private readonly establishmentService: EstablishmentService,
    //private readonly userService: UserService
  ) { }

  @Get('')
  async getPaginatedEstablishments(@Query() params: EstablishmentsPaginationQueryParamsDto) {
    const { page, establishments, limit, total } = await this.establishmentService.getPaginatedEstablishments(params);

    return {
      data: establishments,
      meta: {
        currentPage: page,
        itemCount: establishments.length,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };;
  }

  // Owner list my establishments
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Get('mine')
  async getMyEstablishments(@GetUser('id') userId: string): Promise<ApiResponse<Establishment[]>> {
    const items = await this.establishmentService.getEstablishmentsByUser(userId);
    return { ok: true, data: items };
  }

  @Get(':id')
  async getEstablishmentById(@Param('id') { id }: UUIDParamDto) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) return new NotFoundException('No se encontro el establecimiento');
    return { ok: true, data: establishment };
  }

  // Owner create establishment for self
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN, Roles.BUSINESS_OWNER)
  @Post('mine')
  async createMyEstablishment(@Body() establishmentDto: EstablishmentDto, @GetUser() user: User) {
    const establishment = await this.establishmentService.createEstablishment(establishmentDto, user);
    if (!establishment) return new NotFoundException('No se pudo crear el establecimiento');
    return { ok: true, data: establishment };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Put(':id')
  async updateMyEstablishment(@Param('id') id: string, @Body() establishmentDto: EstablishmentDto) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) return new NotFoundException('No se encontro el establecimiento');

    const updatedEstablishment = await this.establishmentService.updateEstablishment(establishment, establishmentDto);
    return { ok: true, data: updatedEstablishment };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Delete(':id')
  async deleteMyEstablishment(@Param('id') id: string) {
    const establishmentToDelete = await this.establishmentService.getEstablishmentById(id);
    if (!establishmentToDelete) throw new NotFoundException('No se encontro el establecimiento');
    
    const result = await this.establishmentService.deleteEstablishment(establishmentToDelete);
    return { ok: true, data: result };
  }

  // Admin verify toggle
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Patch(':id/verify')
  async verifyEstablishment(@Param('id') id: string, @Body('verified') verified: boolean) {
    const updatedEstablishment = await this.establishmentService.setVerified(id, verified);
    return { ok: true, data: updatedEstablishment };
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
        destination: './upload/user/establishment/',
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
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    if (!file) throw new BadRequestException('No se envio un archivo');
    const updatedEstablishment = await this.establishmentService.updateAvatar(establishment, file.filename);
    return { ok: true, data: updatedEstablishment };
  }

  // Upload establishment avatar (owner)
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
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
        destination: './upload/user/establishment/',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuid.v4();
          const extension = file.originalname.split('.').pop();
          const uniqueFilename = `${uniqueSuffix}.${extension}`;
          callback(null, uniqueFilename);
        },
      }),
    }),
  )
  async uploadEstablishmentImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log("FILES", files)
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    if (!files || files.length === 0) throw new BadRequestException('No se enviaron archivos');

    // Solo pasar los nombres de archivo
    const fileNames = files.map((file) => file.filename);
    const updatedEstablishment = await this.establishmentService.uploadImages(establishment, fileNames);
    return { ok: true, data: updatedEstablishment };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Patch(':id/completeness')
  async refreshCompleteness(@Param('id') id: string) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    return { ok: await this.establishmentService.refreshCompleteness(id) };
  }
}

