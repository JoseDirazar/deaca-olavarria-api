import { Category } from '@models/Category.entity';
import { Subcategory } from '@models/Subcategory.entity';
import { IsArray, IsEmail, IsNotEmpty, IsString, IsUrl, Length } from 'class-validator';

export class EstablishmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ max_allowed_length: 255 })
  website: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ max_allowed_length: 255 })
  instagram: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ max_allowed_length: 255 })
  facebook: string;

  @IsString()
  @IsNotEmpty()
  latitude: string;

  @IsString()
  @IsNotEmpty()
  longitude: string;

  @IsNotEmpty()
  @IsArray()
  categories: Category[];

  @IsNotEmpty()
  @IsArray()
  subcategories: Subcategory[];
}
