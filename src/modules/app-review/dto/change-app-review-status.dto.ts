import { AppReviewStatus } from '@models/AppReview.entity';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class ChangeAppReviewStatusDto {
  @IsEnum(AppReviewStatus)
  @IsNotEmpty()
  status: AppReviewStatus;
}
