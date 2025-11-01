import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FarmaciasService } from './pharmacy.service';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';

@Controller('farmacias')
export class FarmaciasController {
  constructor(private readonly farmaciasService: FarmaciasService) {}

  @Get()
  async obtenerFarmacias() {
    return this.farmaciasService.obtenerFarmaciasDesdeCache();
  }
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async refrescarCache() {
    return this.farmaciasService.refrescarCacheMensual();
  }
}
