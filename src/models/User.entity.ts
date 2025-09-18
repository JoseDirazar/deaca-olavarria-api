import { Index, OneToMany } from 'typeorm';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../infrastructure/models/Base.entity';
import { Session } from './Session.entity';
import { Roles } from 'src/infrastructure/types/enums/roles';

@Entity()
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', length: 128, nullable: false, select: false })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  emailCode: string;

  @Column({ type: 'varchar', length: 255, default: '', nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 255, default: '', nullable: true })
  lastName: string;

  @Column({ nullable: true })
  emailCodeCreateAt: Date;

  @Column({ type: 'enum', enum: Roles, default: Roles.USER })
  role: Roles;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];
}
