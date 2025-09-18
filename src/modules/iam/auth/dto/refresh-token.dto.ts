import { IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Introduce un refresh token.' })
  refreshToken: string;
}
