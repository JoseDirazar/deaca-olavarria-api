import { BaseEntity } from "src/infrastructure/models/Base.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { Image } from "./Image.entity";

@Entity({ name: 'event' })
export class Event extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'timestamp' })
    start: Date;

    @Column({ type: 'timestamp' })
    end: Date;

    @Column({ type: 'varchar', length: 255 })
    time: string;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    longitude: number;

    @Column({ nullable: true, type: 'decimal', precision: 2 })
    price: number | null;

    @Column({ default: false, type: 'bool' })
    active: boolean;

    @Column({ default: false, type: 'bool' })
    verified: boolean;

    @Column({ default: false, type: 'boolean' })
    isSingleTime: boolean;

    @Column({ nullable: true, type: 'varchar', length: 255 })
    image: string | null;

    @OneToMany(() => Image, (image) => image.event, { cascade: true, onDelete: 'CASCADE' })
    gallery: Image[] | null
}