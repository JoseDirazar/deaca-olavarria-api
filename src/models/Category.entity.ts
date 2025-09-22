import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Subcategory } from './Subcategory.entity';
import { Establishment } from './Establishment.entity';

@Entity()
export class Category extends BaseEntity {
  @Column()
  name: string;

  @OneToMany(() => Subcategory, (subcategory) => subcategory.category, { cascade: true })
  subcategories: Subcategory[];

  @ManyToOne(() => Establishment, (establishment) => establishment.categories)
  establishments: Establishment[];
}
