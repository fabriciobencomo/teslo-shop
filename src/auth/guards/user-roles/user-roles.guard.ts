import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from 'src/auth/decorators/role-protected.decorator';

@Injectable()
export class UserRolesGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector, // Replace with actual dependencies if needed
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles = this.reflector.get(META_ROLES, context.getHandler());

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if(!user) {
      throw new BadRequestException('User not found in request');
    }
    

    for( const role of user.roles) {
      if(validRoles.includes(role)) {
        return true;
      }
    }


    throw new ForbiddenException(`User does not have any of the required roles: ${validRoles.join(', ')}`);
  }
}
