import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Establishment } from './Establishment.entity';
import { Exclude } from 'class-transformer';
import { Event } from './Event.entity';

@Entity()
export class Image extends BaseEntity {
  @Column()
  fileName: string;

  @ManyToOne(() => Establishment, (establishment) => establishment.images, { onDelete: 'CASCADE' })
  @Exclude({ toPlainOnly: true }) // Excluir al serializar para evitar referencias circulares
  establishment: Establishment;

  @ManyToOne(() => Event, (event) => event.gallery, { onDelete: 'CASCADE' })
  @Exclude({ toPlainOnly: true }) // Excluir al serializar para evitar referencias circulares
  event: Event;
}
