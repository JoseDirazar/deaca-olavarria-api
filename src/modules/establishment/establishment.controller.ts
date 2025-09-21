import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { EstablishmentService } from './establishment.service';
import { PaginatedResponse } from 'src/infrastructure/types/interfaces/pagination.interface';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';

@Controller('establishment')
export class EstablishmentController {
  constructor(private readonly establishmentService: EstablishmentService) {}

  @Get('')
  async getEstablishments(@Query() params: EstablishmentsPaginationQueryParamsDto) {
    const establishments = await this.establishmentService.getEstablishments(params);
    if (!establishments) return new NotFoundException('No se encontraron establecimientos');

    return { establishments };
  }
}
