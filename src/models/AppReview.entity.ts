import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './User.entity';

export enum Status {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
@Entity('app_review')
export class AppReview extends BaseEntity {
  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'enum', enum: Status, default: Status.PENDING })
  status: Status;

  @OneToOne(() => User, { cascade: true })
  @JoinColumn({ name: 'userId' })
  user: User;
}
