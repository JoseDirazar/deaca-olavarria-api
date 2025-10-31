import { BaseEntity } from '../../../infrastructure/models/Base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Establishment } from '@models/Establishment.entity';

@Entity('tendency')
@Unique('UQ_tendency_position', ['position'])
@Unique('UQ_tendency_establishment', ['establishmentId'])
export class Tendency extends BaseEntity {
  @ManyToOne(() => Establishment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establishment_id' })
  establishment?: Establishment;

  @Column({ type: 'varchar', name: 'establishment_id' })
  @Index()
  establishmentId: string;

  @Column({ type: 'int', nullable: false })
  position: number;
}
