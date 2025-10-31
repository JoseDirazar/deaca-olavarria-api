import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('register-visit')
  async registerVisit(@Req() req: Request) {
    return { data: await this.analyticsService.registerVisit(req) };
  }

  @Get('establishment-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  async getVisitsByEstablishmentOwnerId(@GetUser('id') ownerId: string) {
    return { data: await this.analyticsService.getVisitsByEstablishmentOwnerId(ownerId) };
  }

  @Get('admin-analytics-chart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async getAdminAnalyticsChart() {
    return { data: await this.analyticsService.getAdminAnalyticsChart() };
  }
}
