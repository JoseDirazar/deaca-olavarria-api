import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppReview } from '@models/AppReview.entity';
import { Repository } from 'typeorm';
import { AppReviewDto } from './dto/app-review.dto';

@Injectable()
export class AppReviewService {
  constructor(
    @InjectRepository(AppReview) private readonly appReviewRepository: Repository<AppReview>,
  ) {}

  async findAll() {
    const reviews = await this.appReviewRepository
      .createQueryBuilder('appReview')
      .leftJoinAndSelect('appReview.user', 'user')
      .leftJoinAndSelect('user.establishments', 'establishments')
      .select([
        'appReview.id',
        'appReview.comment',
        'user.id',
        'user.firstName',
        'user.avatar',
        'establishments.name',
      ])
      .getMany();
    return reviews;
  }

  async findOneByUserId(userId: string) {
    return this.appReviewRepository.findOneBy({ user: { id: userId } });
  }

  async createAppReview(userId: string, appReviewDto: AppReviewDto) {
    const appReview = this.appReviewRepository.create({ ...appReviewDto, user: { id: userId } });
    return this.appReviewRepository.save(appReview);
  }

  async updateAppReview(userId: string, id: string, appReviewDto: AppReviewDto) {
    const appReview = await this.appReviewRepository.findOneBy({ id });
    if (!appReview) return null;
    if (appReview.user.id !== userId) return null;
    return this.appReviewRepository.save({ ...appReview, ...appReviewDto });
  }

  async deleteAppReview(userId: string, id: string) {
    const appReview = await this.appReviewRepository.findOneBy({ id });
    if (!appReview) return null;
    if (appReview.user.id !== userId) return null;
    return this.appReviewRepository.delete(id);
  }
}
