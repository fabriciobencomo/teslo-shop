import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';

@Module({
  controllers: [ProductsController],
  imports:[
    TypeOrmModule.forFeature([Product, ProductImage]),
  ],
  exports: [ProductsService, TypeOrmModule],
  providers: [ProductsService],
})
export class ProductsModule {}
