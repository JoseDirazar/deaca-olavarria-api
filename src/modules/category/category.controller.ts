import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '@modules/iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/iam/auth/guards/roles.guard';
import { RolesAllowed } from '@modules/iam/auth/dto/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';

import { ApiResponse } from 'src/infrastructure/types/interfaces/api-response.interface';
import { Category } from '@models/Category.entity';
import { UploadInterceptor } from 'src/infrastructure/interceptors/upload.interceptor';
import { CATEGORY_ICON_PATH } from 'src/infrastructure/utils/upload-paths';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('')
  async getCategories(@Query() query: { exclude?: string[]; select?: string[] }) {
    const categories = await this.categoryService.getCategories(query);

    if (!categories) return new NotFoundException('No se encontraron categorias');

    return { data: categories };
  }

  @Get('subcategories')
  async getSubcategories() {
    const subcategories = await this.categoryService.getSubcategories();

    if (!subcategories) return new NotFoundException('No se encontraron subcategorias');

    return { data: subcategories };
  }

  @Get(':id/subcategories')
  async getSubcategoriesByCategory(@Param('id', new ParseUUIDPipe()) id: string) {
    const subcategories = await this.categoryService.getSubcategoriesByCategory(id);

    if (!subcategories) return new NotFoundException('No se encontraron subcategorias');

    return { data: subcategories };
  }

  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async createCategory(@Body() categoryDto: CreateCategoryDto) {
    if (!categoryDto) return new BadRequestException('La categoria es requerida');
    const category = await this.categoryService.createCategory(categoryDto);
    if (!category) return new NotFoundException('No se encontro la categoria');
    return { data: category };
  }

  @Post('subcategories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async createSubcategory(@Body() { name, categoryId }: { name: string; categoryId: string }) {
    if (!name) return new BadRequestException('El nombre es requerido');
    if (!categoryId) return new BadRequestException('El id de la categoria es requerido');
    const subcategory = await this.categoryService.createSubcategory(categoryId, name);
    if (!subcategory) return new NotFoundException('No se encontro la subcategoria');
    return { data: subcategory };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async updateCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() { name }: { name: string },
  ) {
    const category = await this.categoryService.updateCategory(id, name);
    return { data: category };
  }

  @Put('subcategories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async updateSubcategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() { name }: { name: string },
  ) {
    const subcategory = await this.categoryService.updateSubcategory(id, name);
    return { data: subcategory };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async deleteCategory(@Param('id', new ParseUUIDPipe()) id: string) {
    this.categoryService.deleteCategory(id);
    return { ok: true };
  }

  @Delete('subcategories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async deleteSubcategory(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.categoryService.deleteSubcategory(id);
    return { ok: true };
  }

  @Put(':id/icon')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UploadInterceptor(CATEGORY_ICON_PATH, ['jpg', 'png', 'svg']))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ): Promise<ApiResponse<Category>> {
    if (!file) throw new BadRequestException('No se envio un archivo');

    const category = await this.categoryService.findOne(id);
    if (!category) throw new NotFoundException('Categoria no encontrada');

    const categorySaved = await this.categoryService.changeIcon(category, file.path);

    return { data: categorySaved };
  }
}
