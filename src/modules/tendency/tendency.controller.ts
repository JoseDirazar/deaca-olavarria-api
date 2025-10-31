import {
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
import { TendencyService } from './tendency.service';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';

@Controller('tendency')
export class TendencyController {
  constructor(private readonly tendencyService: TendencyService) {}

  @Get()
  async list() {
    return { data: await this.tendencyService.list() };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async createOrUpdate(
    @Body()
    body: {
      establishmentId: string;
      position: number;
    },
  ) {
    const data = await this.tendencyService.createOrUpdate(body);
    return { data, message: 'Tendencia guardada' };
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async reorder(
    @Body()
    body: {
      items: { id: string; position: number }[];
    },
  ) {
    const data = await this.tendencyService.reorder(body.items);
    return { data, message: 'Tendencias reordenadas' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.tendencyService.remove(id);
    return { data, message: 'Tendencia eliminada' };
  }
}
