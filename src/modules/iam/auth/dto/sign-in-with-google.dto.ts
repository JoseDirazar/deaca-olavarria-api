import { IsNotEmpty } from 'class-validator';

export class SignInWithGoogleDto {
  @IsNotEmpty()
  accessToken: string;
}
