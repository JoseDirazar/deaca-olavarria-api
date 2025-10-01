import { IsNotEmpty, IsString } from 'class-validator';

export class SignInWithGoogleDto {
  @IsNotEmpty()
  @IsString()
  accessToken: string;
}
