import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Establishment } from './Establishment.entity';

@Entity()
export class Image extends BaseEntity {
  @Column()
  fileName: string;

  @ManyToOne(() => Establishment, (establishment) => establishment.images)
  establishment: Establishment;
}
