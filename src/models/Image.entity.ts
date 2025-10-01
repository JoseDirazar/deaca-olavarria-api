import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Establishment } from './Establishment.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Image extends BaseEntity {
  @Column()
  fileName: string;

  @ManyToOne(() => Establishment, (establishment) => establishment.images)
  @Exclude({ toPlainOnly: true }) // Excluir al serializar para evitar referencias circulares
  establishment: Establishment;
}
