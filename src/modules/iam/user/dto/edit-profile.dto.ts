import {
  IsString,
  Length,
  IsOptional,
  IsBoolean,
} from 'class-validator';

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
}
