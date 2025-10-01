import {
  IsString,
  Length,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Roles } from 'src/infrastructure/types/enums/Roles';

export class EditProfileDto {
  @IsString()
  @IsOptional()
  @Length(3, undefined, {
    message: 'First name must be at least 3 characters long.',
  })
  firstName?: string;

  @IsString()
  @IsOptional()
  @Length(3, undefined, {
    message: 'Last name must be at least 3 characters long.',
  })
  lastName?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @IsString()
  @IsOptional()
  emailCode?: string;

  @IsString()
  @IsOptional()
  emailCodeCreatedAt?: Date;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(Roles)
  @IsOptional()
  role?: Roles;

  @IsString()
  @IsOptional()
  lastLogin?: Date;
}
