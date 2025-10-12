import { Category } from '@models/Category.entity';
import { Subcategory } from '@models/Subcategory.entity';
import { UploadService } from '@modules/upload/upload.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory) private readonly subcategoryRepository: Repository<Subcategory>,
    private readonly uploadService: UploadService,
  ) { }

  async findOne(id: string) {
    return await this.categoryRepository.findOne({ where: { id } });
  }
  async getCategories() {
    return await this.categoryRepository.find({ relations: ['subcategories'] });
  }

  async getSubcategories() {
    return await this.subcategoryRepository.find();
  }

  async getSubcategoriesByCategory(id: string) {
    return await this.subcategoryRepository.find({ where: { category: { id } } });
  }

  async createCategory(name: string) {
    const category = this.categoryRepository.create({ name });
    return await this.categoryRepository.save(category);
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
      const oldIconPath = this.uploadService.resolveUploadPath('assets', category.icon);
      await this.uploadService.deleteFileIfExists(oldIconPath);
    }
    const normalizedPath = await this.uploadService.normalizeImage(icon);
    category.icon = normalizedPath;
    return await this.categoryRepository.save(category);
  }
}
