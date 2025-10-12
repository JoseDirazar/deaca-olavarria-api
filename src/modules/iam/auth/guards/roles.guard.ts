import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../dto/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: Roles } | undefined;

    if (!user?.role) {
      throw new ForbiddenException('Unauthorized');
    }

    const allowed = requiredRoles.includes(user.role as Roles);
    if (!allowed) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
