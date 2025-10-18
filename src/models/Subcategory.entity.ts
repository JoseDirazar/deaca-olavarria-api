import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';
import { Category } from './Category.entity';
import { Establishment } from './Establishment.entity';

@Entity({ name: 'subcategory' })
export class Subcategory extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @ManyToOne(() => Category, (category) => category.subcategories, { onDelete: 'CASCADE' })
  category: Category;

  @ManyToMany(() => Establishment, (establishment) => establishment.subcategories)
  establishments: Establishment[];
}
