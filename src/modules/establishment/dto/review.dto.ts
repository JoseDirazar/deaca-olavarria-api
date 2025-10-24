import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ReviewDto {
  @IsNumber()
  @IsNotEmpty()
  rating: number;
  @IsNotEmpty()
  @IsString()
  comment: string;
}
