import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { Subcategory } from './Subcategory.entity';
import { Establishment } from './Establishment.entity';

@Entity({ name: 'category' })
export class Category extends BaseEntity {
  @Column({ unique: true, type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  icon: string;

  @OneToMany(() => Subcategory, (subcategory) => subcategory.category, { cascade: true })
  subcategories: Subcategory[];

  @ManyToMany(() => Establishment, (establishment) => establishment.categories)
  establishments: Establishment[];
}
