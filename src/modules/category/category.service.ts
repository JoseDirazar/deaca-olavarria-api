import { Category } from '@models/Category.entity';
import { Subcategory } from '@models/Subcategory.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory) private readonly subcategoryRepository: Repository<Subcategory>,
  ) {}

  async getCategories() {
    return await this.categoryRepository.find();
  }
}
