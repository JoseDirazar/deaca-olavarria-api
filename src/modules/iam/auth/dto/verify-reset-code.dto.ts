import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VerifyResetCodeDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Reset code is required' })
  resetCode: string;
}
