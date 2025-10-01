import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Introduce un refresh token.' })
  @IsString({ message: 'El refresh token debe ser un string.' })
  refreshToken: string;
}
