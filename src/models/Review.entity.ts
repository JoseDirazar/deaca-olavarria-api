import { Entity, Column, ManyToOne } from 'typeorm';
import { User } from './User.entity';
import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Establishment } from './Establishment.entity';

@Entity({ name: 'review' })
export class Review extends BaseEntity {
  @ManyToOne(() => User, (user) => user.reviewsGiven, { onDelete: 'CASCADE' })
  reviewer: User;

  @ManyToOne(() => Establishment, (establishment) => establishment.reviewsReceived, {
    onDelete: 'CASCADE',
  })
  establishment: Establishment;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;
}
