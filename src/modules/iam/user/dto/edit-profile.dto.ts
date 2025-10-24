import { AccountStatus } from '@models/User.entity';
import { IsString, Length, IsOptional, IsEnum } from 'class-validator';
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

  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

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
