import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Event } from "@models/Event.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class ActiveEventService {
    private readonly logger = new Logger(ActiveEventService.name);
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleActiveEvents() {
        const result = await this.eventRepository
            .createQueryBuilder()
            .update(Event)
            .set({ active: true })
            .where('start < NOW() AND isSingleTime = false')
            .execute();

        this.logger.log(`📅 Activados ${result.affected} eventos`);
    }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async handleInactiveEvents() {
        const result = await this.eventRepository
            .createQueryBuilder()
            .update(Event)
            .set({ active: false })
            .where('end < NOW()')
            .execute();

        this.logger.log(`📅 Inactivados ${result.affected} eventos`);
    }
}