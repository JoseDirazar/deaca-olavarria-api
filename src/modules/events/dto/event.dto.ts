import { IsNotEmpty, IsString } from 'class-validator';

export class EventDto {
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

  @IsString()
  @IsNotEmpty()
  start: Date;

  @IsString()
  @IsNotEmpty()
  end: Date;

  @IsString()
  @IsNotEmpty()
  time: Date;

  @IsString()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  active: boolean;

  @IsString()
  @IsNotEmpty()
  isSingleTime: boolean;
}
