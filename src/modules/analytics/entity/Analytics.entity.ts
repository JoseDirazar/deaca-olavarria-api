import { BaseEntity } from '../../../infrastructure/models/Base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Establishment } from '@models/Establishment.entity';
import { User } from '@models/User.entity';

@Entity('analytics')
export class Analytics extends BaseEntity {
  @ManyToOne(() => Establishment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establishment_id' })
  establishment: Establishment;

  @Column()
  establishment_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ nullable: true })
  user_id?: string;

  @Column({ nullable: true })
  ip?: string;
}
