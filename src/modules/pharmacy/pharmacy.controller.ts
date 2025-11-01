import { Controller, Get } from '@nestjs/common';
import { FarmaciasService } from './pharmacy.service';

@Controller('farmacias')
export class FarmaciasController {
  constructor(private readonly farmaciasService: FarmaciasService) {}

  @Get()
  async obtenerFarmacias() {
    return this.farmaciasService.obtenerFarmacias();
  }
}
