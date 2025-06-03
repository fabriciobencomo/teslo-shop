import { Inject, Injectable } from '@nestjs/common';
import { ProductImage } from 'src/products/entities/product-image.entity';
import { Product } from 'src/products/entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ){}

  async runSeed() {
    await this.deleteTablets();
    const user = await this.insertUsers();
    await this.insertNewProducts(user);
    return 'SEED EXECUTED';
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];
    seedUsers.forEach(user => {
      users.push(this.userRepository.create(user));
    });

    const dbUsers = await this.userRepository.save(users);

    return dbUsers[0]
  }

  private async deleteTablets(){
    await this.productsService.deleteAllProducts();

    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder
      .delete()
      .where({})
      .execute();
  }

  private async insertNewProducts(user: User) {

    await this.productsService.deleteAllProducts();

    const products = initialData.products;
    const insertPromises: Promise<any>[] = [];

    products.forEach(product => {
      insertPromises.push(this.productsService.create(product, user));
    });

    const result = await Promise.all(insertPromises);
    
    return result;    
  }
}
