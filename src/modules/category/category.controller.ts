import { Controller, Get, NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('')
  async getCategories() {
    const categories = await this.categoryService.getCategories();

    if (!categories) return new NotFoundException('No se encontraron categorias');

    return { categories };
  }
}
