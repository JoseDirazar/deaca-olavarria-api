import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AppReviewService } from './app-review.service';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { AppReviewDto } from './dto/app-review.dto';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';

@Controller('app-review')
export class AppReviewController {
  constructor(private readonly appReviewService: AppReviewService) {}

  @Get()
  async findAll() {
    const reviews = await this.appReviewService.findAll();
    if (!reviews) throw new Error('No reviews found');
    return { data: reviews };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  // @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  async createAppReview(@GetUser('id') userId: string, @Body() appReview: AppReviewDto) {
    const existingReview = await this.appReviewService.findOneByUserId(userId);
    if (existingReview) throw new Error('Review already exists');
    return { data: this.appReviewService.createAppReview(userId, appReview) };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  async updateAppReview(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() appReview: AppReviewDto,
  ) {
    return { data: this.appReviewService.updateAppReview(userId, id, appReview) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  async deleteAppReview(@GetUser('id') userId: string, @Param('id') id: string) {
    return { data: this.appReviewService.deleteAppReview(userId, id) };
  }
}
