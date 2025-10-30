import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Analytics } from '@modules/analytics/entity/Analytics.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepository: Repository<Analytics>,
  ) {}

  async registerVisit({ establishmentId, ip }: { establishmentId: string; ip?: string }) {
    const visit = this.analyticsRepository.create({
      establishment: {
        id: establishmentId,
      },
      ip: this.normalizeIp(ip),
    });
    await this.analyticsRepository.save(visit);
  }

  async getVisitsByEstablishmentOwnerId(ownerId: string) {
    const [visits, total] = await this.analyticsRepository.findAndCount({
      where: {
        establishment: {
          user: {
            id: ownerId,
          },
        },
      },
    });
    return { visits, total };
  }

  private normalizeIp(ip: string | undefined): string {
    return ip?.startsWith('::ffff:') ? ip.replace('::ffff:', '') : (ip ?? '');
  }
}
