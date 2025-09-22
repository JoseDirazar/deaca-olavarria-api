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

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column()
  website: string;

  @Column()
  description: string;

  @Column()
  avatar: string;

  @Column()
  instagram: string;

  @Column()
  facebook: string;

  @Column()
  latitude: string;

  @Column()
  longitude: string;

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
