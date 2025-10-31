import { BaseEntity } from 'src/infrastructure/models/Base.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { Image } from './Image.entity';

@Entity({ name: 'event' })
export class Event extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp' })
  start: Date;

  @Column({ type: 'timestamp' })
  end: Date;

  @Column({ type: 'timestamp' })
  time: Date;

  //TODO: cambiar en toda la api como se maneja latitud y longitud, guardarlo en un solo string y tal vez existe la prop para latlng en postgres
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  longitude: string;

  @Column({ nullable: true, type: 'decimal', precision: 2 })
  price: number | null;

  @Column({ default: false, type: 'boolean' })
  active: boolean;

  @Column({ default: false, type: 'boolean' })
  isSingleTime: boolean;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  image: string | null;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  slug: string;

  @OneToMany(() => Image, (image) => image.event, { cascade: true, onDelete: 'CASCADE' })
  gallery: Image[] | null;

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
