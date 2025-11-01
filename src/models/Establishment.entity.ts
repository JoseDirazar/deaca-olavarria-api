import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Category } from './Category.entity';
import { Subcategory } from './Subcategory.entity';
import { Image } from './Image.entity';
import { Review } from './Review.entity';
import { User } from './User.entity';
import { Analytics } from '@modules/analytics/entity/Analytics.entity';

export enum EstablishmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}
@Entity({ name: 'establishment' })
export class Establishment extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  address: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  phone: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  website: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  avatar: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  instagram: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  facebook: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) //TODO sacar nullable
  latitude: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) //TODO sacar nullable
  longitude: string;

  @Column({ type: 'enum', enum: EstablishmentStatus, default: EstablishmentStatus.PENDING })
  status: EstablishmentStatus;

  @Column({ nullable: true, type: 'decimal', precision: 2 })
  rating: number;

  @Column({ default: false, nullable: true, type: 'bool' })
  acceptDebitCard: boolean;

  @Column({ default: false, nullable: true, type: 'bool' })
  acceptCreditCard: boolean;

  @Column({ nullable: true, type: 'decimal', precision: 2 })
  cashDiscount: number;

  @Column({ default: false, nullable: true, type: 'bool' })
  acceptMercadoPago: boolean;

  @Column({ default: false, nullable: true, type: 'bool' })
  acceptCtaDNI: boolean;

  @Column({ nullable: true, type: 'varchar', length: 255, unique: true })
  slug: string;

  @OneToMany(() => Review, (review) => review.establishment, { cascade: true })
  reviewsReceived: Review[] | null;

  @ManyToMany(() => Category, (category) => category.establishments, { cascade: true })
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Subcategory, (subcategory) => subcategory.establishments, { cascade: true })
  @JoinTable()
  subcategories: Subcategory[];

  @OneToMany(() => Image, (image) => image.establishment, { cascade: true, onDelete: 'CASCADE' })
  images: Image[] | null;

  @ManyToOne(() => User, (user) => user.establishments, { cascade: true })
  user: User;

  @OneToMany(() => Analytics, (analytics) => analytics.establishment, { cascade: true })
  visits: Analytics[] | null;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    this.slug =
      this.name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') ?? this.name;
  }
}
