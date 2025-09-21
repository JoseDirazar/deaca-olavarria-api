import { BasePaginationQueryParamsDto } from 'src/infrastructure/dto/base-pagination-params.dto';

export class EstablishmentsPaginationQueryParamsDto extends BasePaginationQueryParamsDto {
  category: string;
}
