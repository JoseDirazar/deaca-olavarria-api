import { Index, OneToMany } from 'typeorm';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from './Base.entity';
import { Session } from './Session.entity';

export enum UserRoleType {
  ADMIN = 'admin',
  INTERNAL = 'internal',
  USER = 'user',
}

@Entity({ name: 'user' })
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
  email_code: string;

  @Column({ type: 'varchar', length: 255, default: '', nullable: true })
  first_name: string;

  @Column({ type: 'varchar', length: 255, default: '', nullable: true })
  last_name: string;

  @Column({ nullable: true })
  email_code_create_at: Date;

  @Column({ type: 'enum', enum: UserRoleType, default: UserRoleType.USER })
  role: UserRoleType;

  @Column({ type: 'timestamp', nullable: true })
  last_login?: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];
}
