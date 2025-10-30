import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppReview, AppReviewStatus } from '@models/AppReview.entity';
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
        'appReview.createdAt',
        'appReview.status',
        'user.id',
        'user.firstName',
        'user.avatar',
        'establishments.name',
      ])
      .orderBy('appReview.createdAt', 'DESC')
      .getMany();
    return reviews;
  }

  async findOneByUserId(userId: string) {
    return this.appReviewRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findOneById(id: string) {
    return this.appReviewRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async createAppReview(userId: string, appReviewDto: AppReviewDto) {
    const appReview = this.appReviewRepository.create({ ...appReviewDto, user: { id: userId } });
    return this.appReviewRepository.save(appReview);
  }

  async updateAppReview(appReview: AppReview, appReviewDto: AppReviewDto) {
    return this.appReviewRepository.save({ ...appReview, ...appReviewDto });
  }

  async deleteAppReview(appReview: AppReview) {
    return this.appReviewRepository.delete(appReview.id);
  }

  async updateAppReviewStatus(appReview: AppReview, status: AppReviewStatus) {
    return this.appReviewRepository.save({ ...appReview, status });
  }
}
