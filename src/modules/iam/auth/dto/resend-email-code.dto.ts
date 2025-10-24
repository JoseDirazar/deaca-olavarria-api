import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendEmailCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
