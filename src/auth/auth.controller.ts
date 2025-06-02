import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { GetRawHeaders } from './decorators/get-rawheaders.decorator';
import { UserRolesGuard } from './guards/user-roles/user-roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @GetUser() user: User,
    @GetRawHeaders() rawHeaders: string[]
  ) {
    
    return {
      ok: true,
      message: 'You are authenticated',
      user,
      rawHeaders,
    };
  }

  @Get('private2')
  @SetMetadata('roles', [
    'admin',
    'super-user',
  ])
  @UseGuards(AuthGuard(), UserRolesGuard)
  testingPrivateRoute2(
    @GetUser() user: User,
  ) {
    
    return {
      ok: true,
      message: 'You are authenticated',
      user,
    };
  }
}
