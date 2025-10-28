import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Analytics } from '@modules/analytics/entity/Analytics.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepository: Repository<Analytics>,
  ) {}

  async registerVisit({
    establishmentId,
    userId,
    ip,
  }: {
    establishmentId: string;
    userId?: string;
    ip?: string;
  }) {
    const visit = this.analyticsRepository.create({
      establishment_id: establishmentId,
      user_id: userId,
      ip: this.normalizeIp(ip),
    });
    await this.analyticsRepository.save(visit);
  }

  private normalizeIp(ip: string | undefined): string {
    return ip?.startsWith('::ffff:') ? ip.replace('::ffff:', '') : (ip ?? '');
  }
}
