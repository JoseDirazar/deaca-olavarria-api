import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Establishment } from './Establishment.entity';
import { Exclude } from 'class-transformer';
import { Event } from './Event.entity';
import { NatureSpot } from './NatureSpot.entity';

@Entity({ name: 'image' })
export class Image extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @ManyToOne(() => Establishment, (establishment) => establishment.images, { onDelete: 'CASCADE' })
  @Exclude({ toPlainOnly: true })
  establishment: Establishment;

  @ManyToOne(() => Event, (event) => event.gallery, { onDelete: 'CASCADE' })
  @Exclude({ toPlainOnly: true })
  event: Event;

  @ManyToOne(() => NatureSpot, (natureSpot) => natureSpot.gallery, { onDelete: 'CASCADE' })
  @Exclude({ toPlainOnly: true })
  natureSpot: NatureSpot;
}
