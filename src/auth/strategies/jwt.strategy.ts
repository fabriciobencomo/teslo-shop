import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET') || 'defaultSecretKey',
    });
  }

  async validate(payload: JwtPayload) {
    // Here you can add additional validation logic if needed
    const {id} = payload;

    const user = await this.userRepository.findOneBy({id});

    if (!user) {
      throw new UnauthorizedException('Token is not valid');
    }

    if(!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    return user;
  }
}