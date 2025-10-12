import { Injectable, NotFoundException } from "@nestjs/common";
import { Event } from "@models/Event.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventDto } from "./dto/event.dto";

@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>
    ) { }

    async createEvent(eventDto: EventDto): Promise<Event> {
        const event = this.eventRepository.create(eventDto);
        return this.eventRepository.save(event);
    }

    async getEvents(): Promise<Event[]> {
        return this.eventRepository.find();
    }

    async getActiveEvents(): Promise<Event[]> {
        return this.eventRepository.find({ where: { active: true } });
    }

    async getEventById(id: string): Promise<Event | null> {
        return await this.eventRepository.findOne({ where: { id } });
    }

    async updateEvent(id: string, eventDto: EventDto): Promise<Event> {
        const event = await this.eventRepository.findOne({ where: { id } });
        if (!event) throw new NotFoundException('Evento no encontrado');
        return this.eventRepository.save({ ...event, ...eventDto });
    }

    async deleteEvent(id: string): Promise<void> {
        await this.eventRepository.delete(id);
    }
}