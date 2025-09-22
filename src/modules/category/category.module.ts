import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '@models/Category.entity';
import { Subcategory } from '@models/Subcategory.entity';
import { AuthModule } from '@modules/iam/auth/auth.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports: [TypeOrmModule.forFeature([Category, Subcategory]), AuthModule],
})
export class CategoryModule {}
