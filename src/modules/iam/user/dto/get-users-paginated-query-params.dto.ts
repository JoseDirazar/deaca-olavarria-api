import { BasePaginationQueryParamsDto } from "src/infrastructure/dto/base-pagination-params.dto";
import { Roles } from "src/infrastructure/types/enums/Roles";

export class GetUsersPaginatedQueryParamsDto extends BasePaginationQueryParamsDto {
    role?: Roles;
    email?: string;
    // Column to sort by (whitelisted on service)
    sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'role' | 'lastLogin';
    // Sort direction
    sortOrder?: 'ASC' | 'DESC';
}
