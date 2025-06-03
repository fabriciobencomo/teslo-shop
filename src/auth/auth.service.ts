import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(  
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Assuming CreateUserDto is a TypeORM entity or similar
    private readonly jwtService: JwtService, // Assuming JwtService is imported from @nestjs/jwt
    )
    {}

  async create(createUserDto: CreateUserDto) {
    try {

      const {password, ...userData} = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10), // Hashing the password
      });
      
      await this.userRepository.save(user);

      return {
        ...user,
        token: this.getJwtToken({ id: user.id }),
      };

    }catch (error) { 
      this.handleDbError(error);
    }
  }

  async login(loginUserDto: LoginUserDto){
    try{
      const {email, password} = loginUserDto;

      const user = await this.userRepository.findOne({ 
        where: { email },
        select: ['email', 'password', 'id'],
       });
      if(!user) {
        throw new InternalServerErrorException('User not found');
      }

      if(bcrypt.compareSync(password, user.password) === false) {
        throw new InternalServerErrorException('Invalid credentials'); 
      }
    
      return {
        ...user,
        token: this.getJwtToken({ id: user.id }),
      };


    } catch (error) {
      this.handleDbError(error);
    }

  }

  checkAuthStatus(user: User) {
    if(!user) {
      throw new InternalServerErrorException('User not found');
    }
  const payload: JwtPayload = { id: user.id };
  const token = this.getJwtToken(payload);
  return {
      ...user,
      token,
    };
  }
    

  private getJwtToken(payload: JwtPayload){
    const token = this.jwtService.sign(payload);
    return token
  }

  

  private handleDbError(error: any): never {
    if(error.code === '23505'){
      throw new Error(error.detail || 'Duplicate key error');
    }

    console.log('Database error:', error);

    throw new InternalServerErrorException('Check server logs for more details');

  }

}

