import { BaseEntity } from "src/infrastructure/models/Base.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { Image } from "./Image.entity";

@Entity()
export class Event extends BaseEntity {
    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ type: 'timestamp' })
    start: Date;

    @Column({ type: 'timestamp' })
    end: Date;

    @Column()
    time: string;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    longitude: number;

    @Column({ nullable: true, type: 'decimal', precision: 2 })
    price: number | null;

    @Column({ default: false })
    active: boolean;

    @Column({ default: false })
    isSingleTime: boolean;

    @Column({ nullable: true, type: 'varchar' })
    image: string | null;

    @OneToMany(() => Image, (image) => image.event, { cascade: true, onDelete: 'CASCADE' })
    gallery: Image[] | null
}