import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { ProductsService } from 'src/products/products.service';
import { ProductsModule } from 'src/products/products.module';

@Module({
  controllers: [SeedController],
  imports:[ProductsModule],
  providers: [SeedService],
})
export class SeedModule {}
