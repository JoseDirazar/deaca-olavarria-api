import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('establishment-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.BUSINESS_OWNER, Roles.ADMIN)
  async getVisitsByEstablishmentOwnerId(@GetUser('id') ownerId: string) {
    return { data: await this.analyticsService.getVisitsByEstablishmentOwnerId(ownerId) };
  }
}
