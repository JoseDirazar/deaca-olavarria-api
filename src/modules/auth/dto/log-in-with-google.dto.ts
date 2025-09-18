import { IsNotEmpty } from 'class-validator';

export class LogInWithGoogleDto {
  @IsNotEmpty({ message: 'Introduce un tu cuenta de google.' })
  accessToken: string;
}
