import { BeforeInsert, BeforeUpdate, Index, OneToMany } from 'typeorm';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../infrastructure/models/Base.entity';
import { Session } from './Session.entity';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { Review } from './Review.entity';
import { Establishment } from './Establishment.entity';
import * as argon2 from 'argon2';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

@Entity({ name: 'user' })
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.PENDING })
  status: AccountStatus;

  @Column({ type: 'varchar', length: 128, nullable: false, select: false })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 255, default: '', select: false })
  emailCode: string;

  @Column({ type: 'varchar', length: 255, default: '', nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 255, default: '', nullable: true })
  lastName: string;

  @Column({ nullable: true, type: 'timestamp', select: false })
  emailCodeCreatedAt: Date;

  @Column({ type: 'enum', enum: Roles, default: Roles.USER })
  role: Roles;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => Review, (review) => review.reviewer)
  reviewsGiven: Review[];

  @OneToMany(() => Establishment, (establishment) => establishment.user)
  establishments: Establishment[];

  @BeforeInsert()
  private async hashPasswordOnInsert() {
    if (this.password) {
      this.password = await argon2.hash(this.password);
    }
  }

  @BeforeUpdate()
  private async hashPasswordOnUpdate() {
    // Solo hashear si el password cambió
    if (this.password && !this.password.startsWith('$argon2')) {
      this.password = await argon2.hash(this.password);
    }
  }
}
