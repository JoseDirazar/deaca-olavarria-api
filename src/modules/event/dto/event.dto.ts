import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EventDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  description: string;
  @IsString()
  @IsNotEmpty()
  start: Date;
  @IsString()
  @IsNotEmpty()
  end: Date;
  @IsString()
  @IsNotEmpty()
  time: string;
  @IsNumber()
  @IsNotEmpty()
  latitude: number;
  @IsNumber()
  @IsNotEmpty()
  longitude: number;
  @IsNumber()
  @IsNotEmpty()
  price: number;
}
