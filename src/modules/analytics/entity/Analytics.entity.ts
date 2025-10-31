import { BaseEntity } from '../../../infrastructure/models/Base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Establishment } from '@models/Establishment.entity';

@Entity('analytics')
export class Analytics extends BaseEntity {
  @ManyToOne(() => Establishment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establishment_id' })
  establishment?: Establishment;

  @Column({ nullable: true, type: 'varchar' })
  establishmentId: string | null;

  @Column({ nullable: true })
  ip?: string;
}
