import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Analytics } from '@modules/analytics/entity/Analytics.entity';
import { Repository } from 'typeorm';
import { Request } from 'express';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepository: Repository<Analytics>,
  ) {}

  async getVisitsByEstablishmentOwnerId(ownerId: string) {
    const [visits, total] = await this.analyticsRepository.findAndCount({
      where: {
        establishment: {
          user: {
            id: ownerId,
          },
        },
      },
      select: {
        createdAt: true,
      },
    });
    return { visits, total };
  }

  async getAdminAnalyticsChart() {
    return await this.analyticsRepository.find({ select: { createdAt: true } });
  }

  async registerEstablishmentVisit({
    establishmentId,
    ip,
  }: {
    establishmentId: string;
    ip?: string;
  }) {
    const visit = this.analyticsRepository.create({
      establishment: {
        id: establishmentId,
      },
      ip: this.normalizeIp(ip),
    });
    await this.analyticsRepository.save(visit);
  }

  async registerVisit(req: Request) {
    const visit = this.analyticsRepository.create({ ip: this.normalizeIp(req.ip) });
    await this.analyticsRepository.save(visit);
    return { visit };
  }

  private normalizeIp(ip: string | undefined): string {
    return ip?.startsWith('::ffff:') ? ip.replace('::ffff:', '') : (ip ?? '');
  }
}
