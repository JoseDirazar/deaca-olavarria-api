import { Session } from '@models/Session.entity';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredSessions() {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expired_at < NOW()')
      .execute();

    this.logger.log(`🧹 Eliminadas ${result.affected} sesiones expiradas`);
  }
}
