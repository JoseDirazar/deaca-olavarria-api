import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { Subcategory } from './Subcategory.entity';
import { Establishment } from './Establishment.entity';

@Entity()
export class Category extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  icon: string;

  @OneToMany(() => Subcategory, (subcategory) => subcategory.category, { cascade: true })
  subcategories: Subcategory[];

  @ManyToMany(() => Establishment, (establishment) => establishment.categories)
  establishments: Establishment[];
}
