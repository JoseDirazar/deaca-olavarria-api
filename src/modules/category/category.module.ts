import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '@models/Category.entity';
import { Subcategory } from '@models/Subcategory.entity';
import { Image } from '@models/Image.entity';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports: [TypeOrmModule.forFeature([Category, Subcategory, Image])],
})
export class CategoryModule {}
