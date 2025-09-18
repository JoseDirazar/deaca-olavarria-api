import { IsNotEmpty } from 'class-validator';

export class LogInWithGoogleDto {
  @IsNotEmpty()
  accessToken: string;
}
