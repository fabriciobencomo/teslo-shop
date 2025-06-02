import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(  
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Assuming CreateUserDto is a TypeORM entity or similar
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

      return user;
    }catch (error) { 
      this.handleDbError(error);
    }
  }

  private handleDbError(error: any): never {
    if(error.code === '23505'){
      throw new Error(error.detail || 'Duplicate key error');
    }

    console.log('Database error:', error);

    throw new InternalServerErrorException('Check server logs for more details');

  }

}

