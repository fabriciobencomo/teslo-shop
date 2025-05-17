import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { read } from 'fs';
import { Product } from './entities/product.entity';
import {validate as isUUID} from 'uuid';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(    
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ) 
  {}


  async create(createProductDto: CreateProductDto) {
    try {
      const {images = [], ...productDetails} = createProductDto;
      const product = this.productRepository.create(
        {...productDetails, images: images.map(image => this.productImageRepository.create({url: image}))}
      );
      await this.productRepository.save(product);
      return {...product, images};
    } catch (error) {
      this.handleExeception(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto;
    try {
      const products = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations: {
          images: true
        }
      });
      return products.map(product => ({
        ...product,
        images: (product.images ?? []).map(image => image.url)
      }))
    } catch (error) {
      this.handleExeception(error);
    }
  }

  async findOne(term: string) {
    try {
      let product: Product;
      if(isUUID(term)) {
        product = await this.productRepository.findOneBy({id: term}) as Product; 
      }else {
        const queryBuilder = this.productRepository.createQueryBuilder();
        product = await queryBuilder.where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase()
        })
        .leftJoinAndSelect('product.images', 'images')
        .getOne() as Product;
      }
      if(!product) throw new NotFoundException(`Product with id ${term} not found`);
      return product
    } catch (error) {
      this.handleExeception(error);
    }
  }

  async findOnePlain(term: string) {
    const productResult = await this.findOne(term);
    if (!productResult) {
      throw new NotFoundException(`Product with id or term ${term} not found`);
    }
    const {images, ...product} = productResult;
    return {
      ...product,
      images: (images ?? []).map((image: any) => image.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const {images, ...toUpdate} = updateProductDto; 

    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
      images: []
    })

    if(!product) throw new NotFoundException(`Product with id ${id} not found`);

    // create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if(images) {
        await queryRunner.manager.delete(ProductImage, {product: {id}});
        product.images = images.map(image => this.productImageRepository.create({url: image}));
      }

      await queryRunner.manager.save(product);
      // await this.productRepository.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return product
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExeception(error);
    }

  }

  remove(id: string) {
    const product = this.findOne(id);
    if(!product) throw new NotFoundException(`Product with id ${id} not found`);
    this.productRepository.delete(id);
    return product;
  }

  private handleExeception(error: any) {
    if (error.code === '23505') {
      this.logger.error('Product already exists', error);
      throw new BadRequestException('Product already exists');
    }
    throw new Error(error);
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handleExeception(error);
    }
  }
}
