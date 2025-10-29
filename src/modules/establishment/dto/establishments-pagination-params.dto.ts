import { BasePaginationQueryParamsDto } from 'src/infrastructure/dto/base-pagination-params.dto';

export class EstablishmentsPaginationQueryParamsDto extends BasePaginationQueryParamsDto {
  'categories[]'?: string[];
  'subcategories[]'?: string[];
  address?: string;
  // Column to sort by (whitelisted in service)
  sortBy?: 'name' | 'address' | 'createdAt';
  // Sort direction
  sortOrder?: 'ASC' | 'DESC';
}
