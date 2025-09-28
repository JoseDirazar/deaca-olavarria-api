import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { Category } from './Category.entity';
import { Subcategory } from './Subcategory.entity';
import { Image } from './Image.entity';
import { Review } from './Review.entity';
import { User } from './User.entity';

@Entity()
export class Establishment extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ nullable: true })
  latitude: string;

  @Column({ nullable: true })
  longitude: string;

  @Column({ default: false })
  verified: boolean;

  // Se setea en true cuando el perfil tiene avatar y al menos 5 imágenes, y cumple con requisitos mínimos
  @Column({ default: false })
  isComplete: boolean;

  @OneToMany(() => Review, (review) => review.establishment, { cascade: true })
  reviewsReceived: Review[] | null;

  @ManyToMany(() => Category, (category) => category.establishments, { cascade: true })
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Subcategory, (subcategory) => subcategory.establishments, { cascade: true })
  @JoinTable()
  subcategories: Subcategory[];

  @OneToMany(() => Image, (image) => image.establishment, { cascade: true })
  images: Image[] | null;

  @ManyToOne(() => User, (user) => user.establishments, { cascade: true })
  user: User;
}

