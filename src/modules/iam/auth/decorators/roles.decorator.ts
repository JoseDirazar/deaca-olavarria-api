import { SetMetadata } from '@nestjs/common';
import { Roles } from 'src/infrastructure/types/enums/Roles';

export const ROLES_KEY = 'roles';
export const RolesAllowed = (...roles: [Roles, ...Roles[]]) => SetMetadata(ROLES_KEY, roles);
