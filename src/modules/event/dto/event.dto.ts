import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EventDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  description: string;
  @IsDate()
  @IsNotEmpty()
  start: Date;
  @IsDate()
  @IsNotEmpty()
  end: Date;
  @IsDate()
  @IsNotEmpty()
  time: Date;
  @IsString()
  @IsNotEmpty()
  latitude: string;
  @IsString()
  @IsNotEmpty()
  longitude: string;
  @IsNumber()
  @IsNotEmpty()
  price: number;
}
