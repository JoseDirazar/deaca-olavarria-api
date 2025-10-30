import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AppReviewService } from './app-review.service';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { AppReviewDto } from './dto/app-review.dto';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';
import { ChangeAppReviewStatusDto } from './dto/change-app-review-status.dto';

@Controller('app-review')
export class AppReviewController {
  constructor(private readonly appReviewService: AppReviewService) {}

  @Get()
  async findAll() {
    const reviews = await this.appReviewService.findAll();
    return { data: reviews || [] };
  }

  @Get('user')
  async getReviewForUser(@GetUser('id') userId: string) {
    const review = await this.appReviewService.findOneByUserId(userId);
    return { data: review };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  async createAppReview(@GetUser('id') userId: string, @Body() appReview: AppReviewDto) {
    const existingReview = await this.appReviewService.findOneByUserId(userId);
    if (existingReview) throw new BadRequestException('Ya tienes un comentario realizado');
    return {
      data: this.appReviewService.createAppReview(userId, appReview),
      message: 'Comentario creado exitosamente',
    };
  }

  @Put('user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  async updateAppReview(@GetUser('id') userId: string, @Body() appReview: AppReviewDto) {
    const existingReview = await this.appReviewService.findOneByUserId(userId);
    if (!existingReview) throw new BadRequestException('Comentario no encontrado');
    if (existingReview.user.id !== userId)
      throw new BadRequestException('Comentario no encontrado');
    return {
      data: this.appReviewService.updateAppReview(existingReview, appReview),
      message: 'Comentario actualizado exitosamente',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  async deleteAppReview(@GetUser('id') userId: string, @Param('id') id: string) {
    const existingReview = await this.appReviewService.findOneByUserId(id);
    if (!existingReview) throw new BadRequestException('Comentario no encontrado');
    if (existingReview.user.id !== userId)
      throw new BadRequestException('Comentario no encontrado');
    return {
      data: this.appReviewService.deleteAppReview(existingReview),
      message: 'Comentario eliminado exitosamente',
    };
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async updateAppReviewStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() changeAppReviewStatusDto: ChangeAppReviewStatusDto,
  ) {
    const existingReview = await this.appReviewService.findOneById(id);
    if (!existingReview) throw new BadRequestException('Comentario no encontrado');
    const message =
      existingReview.user.firstName && existingReview.user.lastName
        ? `Comentario de ${existingReview.user.firstName} ${existingReview.user.lastName} actualizado exitosamente`
        : `Comentario actualizado exitosamente`;
    return {
      message,
      data: this.appReviewService.updateAppReviewStatus(
        existingReview,
        changeAppReviewStatusDto.status,
      ),
    };
  }
}
