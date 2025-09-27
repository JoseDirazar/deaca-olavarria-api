import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';
import { Category } from './Category.entity';
import { Establishment } from './Establishment.entity';

@Entity()
export class Subcategory extends BaseEntity {
  @Column()
  name: string;

  @ManyToOne(() => Category, (category) => category.subcategories, { onDelete: 'CASCADE' })
  category: Category;

  @ManyToMany(() => Establishment, (establishment) => establishment.subcategories)
  establishments: Establishment[];
}
