import { JoinColumn, ManyToOne } from 'typeorm';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../infrastructure/models/Base.entity';
import { User } from './User.entity';

@Entity()
export class Session extends BaseEntity {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  expiredAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  browser: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  operatingSystem: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  refreshToken: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
