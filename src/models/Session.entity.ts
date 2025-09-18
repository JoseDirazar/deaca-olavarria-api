import { JoinColumn, ManyToOne } from 'typeorm';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../infrastructure/models/Base.entity';
import { User } from './User.entity';

@Entity()
export class Session extends BaseEntity {
  @Column()
  expiredAt: Date;

  @Column()
  ip: string;

  @Column()
  browser: string;

  @Column()
  operatingSystem: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;
}
