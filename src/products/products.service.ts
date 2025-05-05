import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { read } from 'fs';
import { Product } from './entities/product.entity';
import {validate as isUUID} from 'uuid';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(    
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) 
  {}


  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;
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
      });
      return products
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
        }).getOne() as Product;
      }
      if(!product) throw new NotFoundException(`Product with id ${term} not found`);
      return product
    } catch (error) {
      this.handleExeception(error);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
    })

    if(!product) throw new NotFoundException(`Product with id ${id} not found`);

    try {
      await this.productRepository.save(product);
      return product
    } catch (error) {
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
}
