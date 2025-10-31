import { IsNotEmpty, IsString } from 'class-validator';

export class NatureSpotDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  description: string;
  @IsString()
  @IsNotEmpty()
  latitude: string;
  @IsString()
  @IsNotEmpty()
  longitude: string;
}
