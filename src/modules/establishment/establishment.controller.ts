import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Put, Query, UnsupportedMediaTypeException, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { EstablishmentService } from './establishment.service';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { EstablishmentDto } from './dto/establishment.dto';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { Patch, Delete } from '@nestjs/common';
import { User } from '@models/User.entity';
import { ApiResponse } from 'src/infrastructure/types/interfaces/api-response.interface';
import { Establishment } from '@models/Establishment.entity';
import { ReviewDto } from './dto/review.dto';
import { UploadFilesInterceptor, UploadInterceptor } from 'src/infrastructure/interceptors/upload.interceptor';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';
import { UploadService } from '@modules/upload/upload.service';
import { ESTABLISHMENT_LOGO_PATH, ESTABLISHMENT_IMAGES_PATH } from 'src/infrastructure/utils/upload-paths';

@Controller('establishment')
export class EstablishmentController {
  constructor(
    private readonly establishmentService: EstablishmentService,
    private readonly uploadService: UploadService,
  ) { }

  @Get('')
  async getPaginatedEstablishments(@Query() params: EstablishmentsPaginationQueryParamsDto) {
    console.log(params);
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
    return { data: items };
  }

  @Get(':id')
  async getEstablishmentById(@Param('id', new ParseUUIDPipe()) id: string) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) return new NotFoundException('No se encontro el establecimiento');
    return { data: establishment };
  }

  // Owner create establishment for self
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN, Roles.BUSINESS_OWNER)
  @Post('mine')
  async createMyEstablishment(@Body() establishmentDto: EstablishmentDto, @GetUser() user: User) {
    const establishment = await this.establishmentService.createEstablishment(establishmentDto, user);
    if (!establishment) return new NotFoundException('No se pudo crear el establecimiento');
    return { data: establishment };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  @Put(':id')
  async updateMyEstablishment(@Param('id', new ParseUUIDPipe()) id: string, @Body() establishmentDto: EstablishmentDto) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) return new NotFoundException('No se encontro el establecimiento');

    const updatedEstablishment = await this.establishmentService.updateEstablishment(establishment, establishmentDto);
    return { data: updatedEstablishment };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  @Delete(':id')
  async deleteMyEstablishment(@Param('id', new ParseUUIDPipe()) id: string) {
    const establishmentToDelete = await this.establishmentService.getEstablishmentById(id);
    if (!establishmentToDelete) throw new NotFoundException('No se encontro el establecimiento');

    const result = await this.establishmentService.deleteEstablishment(establishmentToDelete);
    return { data: result };
  }

  // Admin verify toggle
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  @Patch(':id/verify')
  async verifyEstablishment(@Param('id', new ParseUUIDPipe()) id: string, @Body('verified') verified: boolean) {
    const updatedEstablishment = await this.establishmentService.setVerified(id, verified);
    return { data: updatedEstablishment };
  }

  // Upload establishment avatar (owner)
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER)
  @Post(':id/avatar')
  @UseInterceptors(UploadInterceptor(ESTABLISHMENT_LOGO_PATH + 'logo/', ['jpg', 'png', "jpeg", "webp"]))
  async uploadEstablishmentAvatar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se envio un archivo');

    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');

    const updatedEstablishment = await this.establishmentService.updateAvatar(establishment, file.filename);
    return { data: updatedEstablishment };
  }

  // Upload establishment avatar (owner)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  @Post(':id/images')
  @UseInterceptors(UploadFilesInterceptor(ESTABLISHMENT_IMAGES_PATH, ['jpg', 'png', "jpeg", "webp"]))
  async uploadEstablishmentImages(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    if (!files || files.length === 0) throw new BadRequestException('No se enviaron archivos');

    const normalizedFileNames = await Promise.all(
      files.map(async (file) => {
        const normalizedName = await this.uploadService.normalizeImage(file.filename);
        return normalizedName;
      })
    );
    const updatedEstablishment = await this.establishmentService.uploadImages(establishment, normalizedFileNames);
    return { data: updatedEstablishment };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  @Patch(':id/completeness')
  async refreshCompleteness(@Param('id', new ParseUUIDPipe()) id: string) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    return { ok: await this.establishmentService.refreshCompleteness(id) };
  }

  @Get(':id/review')
  async getReviews(@Param('id', new ParseUUIDPipe()) id: string) {
    const reviews = await this.establishmentService.getReviewsByEstablishmentId(id);
    if (!reviews) throw new NotFoundException('Calificaciones no encontradas');
    return { data: reviews };
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/review")
  async createReview(@Param('id', new ParseUUIDPipe()) id: string, @GetUser() user: User, @Body() reviewDto: ReviewDto) {
    const establishment = await this.establishmentService.getEstablishmentById(id);
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    if (user.id === establishment.user.id) throw new BadRequestException('No puedes calificar tu propio establecimiento');
    return { data: await this.establishmentService.createReview(user, establishment, reviewDto) };
  }

  @UseGuards(JwtAuthGuard)
  @Put('review/:reviewId')
  async updateReview(@Param('reviewId') reviewId: string, @Body() reviewDto: ReviewDto) {
    const review = await this.establishmentService.getReviewById(reviewId);
    if (!review) throw new NotFoundException('Calificacion no encontrada');
    return { data: await this.establishmentService.updateReview(review, reviewDto, review.establishment) };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('review/:reviewId')
  async deleteReview(@Param('reviewId') reviewId: string) {
    const review = await this.establishmentService.getReviewById(reviewId);
    if (!review) throw new NotFoundException('Calificacion no encontrada');
    return { data: await this.establishmentService.deleteReview(review, review.establishment) };
  }
}

