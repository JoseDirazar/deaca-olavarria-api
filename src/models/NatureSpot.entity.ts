import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { Image } from './Image.entity';

@Entity('nature_spot')
export class NatureSpot extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comment: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string | null;

  @Column({ type: 'varchar', length: 255 })
  latitude: string;

  @Column({ type: 'varchar', length: 255 })
  longitude: string;

  @Column({ default: '', type: 'varchar', length: 255 })
  slug: string;

  @OneToMany(() => Image, (image) => image.natureSpot, { cascade: true, onDelete: 'CASCADE' })
  gallery: Image[];

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
