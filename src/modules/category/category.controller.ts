import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { UUIDParamDto } from 'src/infrastructure/dto/uuid-param.dto';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';
import { RolesAllowed } from '@modules/iam/auth/decorators/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Get('')
  async getCategories() {
    const categories = await this.categoryService.getCategories();

    if (!categories) return new NotFoundException('No se encontraron categorias');

    return { categories };
  }

  @Get('subcategories')
  async getSubcategories() {
    const subcategories = await this.categoryService.getSubcategories();

    if (!subcategories) return new NotFoundException('No se encontraron subcategorias');

    return { subcategories };
  }

  @Get(':id/subcategories')
  async getSubcategoriesByCategory(@Param() { id }: UUIDParamDto) {
    const subcategories = await this.categoryService.getSubcategoriesByCategory(id);

    if (!subcategories) return new NotFoundException('No se encontraron subcategorias');

    return { subcategories };
  }

  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async createCategory(@Body() { name }: { name: string }) {
    if (!name) return new BadRequestException('El nombre es requerido');
    const category = await this.categoryService.createCategory(name);
    if (!category) return new NotFoundException('No se encontro la categoria');
    return { category };
  }

  @Post('subcategories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async createSubcategory(@Body() { name, categoryId }: { name: string; categoryId: string }) {
    if (!name) return new BadRequestException('El nombre es requerido');
    if (!categoryId) return new BadRequestException('El id de la categoria es requerido');
    const subcategory = await this.categoryService.createSubcategory(name, categoryId);
    if (!subcategory) return new NotFoundException('No se encontro la subcategoria');
    return { subcategory };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async updateCategory(@Param() { id }: UUIDParamDto, @Body() { name }: { name: string }) {
    const category = await this.categoryService.updateCategory(id, name);
    return { category };
  }

  @Put('subcategories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async updateSubcategory(@Param() { id }: UUIDParamDto, @Body() { name }: { name: string }) {
    const subcategory = await this.categoryService.updateSubcategory(id, name);
    return { subcategory };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async deleteCategory(@Param() { id }: UUIDParamDto) {
    const category = await this.categoryService.deleteCategory(id);
    return { category };
  }

  @Delete('subcategories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async deleteSubcategory(@Param() { id }: UUIDParamDto) {
    const subcategory = await this.categoryService.deleteSubcategory(id);
    return { subcategory };
  }
}
