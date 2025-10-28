import { Category } from '@models/Category.entity';
import { Subcategory } from '@models/Subcategory.entity';
import { UploadService } from '@modules/upload/upload.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory) private readonly subcategoryRepository: Repository<Subcategory>,
    private readonly uploadService: UploadService,
  ) {}

  async findOne(id: string) {
    return await this.categoryRepository.findOne({ where: { id } });
  }

  async findByName(name: string) {
    return await this.categoryRepository.findOne({ where: { name } });
  }

  async getCategories({ exclude, select }: { exclude?: string[]; select?: string[] }) {
    if (select) {
      const categories = await this.categoryRepository.find({
        relations: ['establishments'],
        where: {
          name: In(select),
        },
      });
      console.log('SELECT', categories);
      return categories;
    }
    if (exclude) {
      const categories = await this.categoryRepository.find({
        relations: ['subcategories'],
        where: {
          name: Not(In(exclude)),
        },
      });
      return categories;
    }
    const categories = await this.categoryRepository.find({ relations: ['subcategories'] });
    return categories;
  }

  async getSubcategories() {
    return await this.subcategoryRepository.find();
  }

  async getSubcategoriesByCategory(id: string) {
    return await this.subcategoryRepository.find({ where: { category: { id } } });
  }

  async createCategory(categoryDto: CreateCategoryDto) {
    const newCategory = this.categoryRepository.create(categoryDto);
    return await this.categoryRepository.save(newCategory);
  }

  async createSubcategory(name: string, categoryId: string) {
    const subcategory = this.subcategoryRepository.create({ name, category: { id: categoryId } });
    return await this.subcategoryRepository.save(subcategory);
  }

  async updateCategory(id: string, name: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) return null;
    category.name = name;
    return await this.categoryRepository.save(category);
  }

  async updateSubcategory(id: string, name: string) {
    const subcategory = await this.subcategoryRepository.findOne({ where: { id } });
    if (!subcategory) return null;
    subcategory.name = name;
    return await this.subcategoryRepository.save(subcategory);
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) return null;
    return await this.categoryRepository.remove(category);
  }

  async deleteSubcategory(id: string) {
    const subcategory = await this.subcategoryRepository.findOne({ where: { id } });
    if (!subcategory) return null;
    return await this.subcategoryRepository.remove(subcategory);
  }

  async changeIcon(category: Category, icon: string) {
    if (category.icon) {
      const oldIconPath = this.uploadService.resolveUploadPath('category', category.icon);
      await this.uploadService.deleteFileIfExists(oldIconPath);
    }
    const normalizedPath = await this.uploadService.normalizeImage(icon, {
      width: 120,
      height: 120,
    });
    category.icon = normalizedPath;
    return await this.categoryRepository.save(category);
  }
}
