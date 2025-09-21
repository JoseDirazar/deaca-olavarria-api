import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { Category } from './Category.entity';
import { Subcategory } from './Subcategory.entity';

@Entity()
export class Establishment extends BaseEntity {
  @Column()
  name: string;

  @ManyToMany(() => Category, (category) => category.establishments, { cascade: true })
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Subcategory, (subcategory) => subcategory.establishments, { cascade: true })
  @JoinTable()
  subcategories: Subcategory[];
}
