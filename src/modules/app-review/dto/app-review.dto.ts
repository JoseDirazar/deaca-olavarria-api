import { IsNotEmpty, IsString } from 'class-validator';

export class AppReviewDto {
  @IsString()
  @IsNotEmpty()
  comment: string;
}
