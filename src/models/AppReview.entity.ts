import { BaseEntity } from "src/infrastructure/models/Base.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { User } from "./User.entity";
@Entity('app_review')
export class AppReview extends BaseEntity {
    @Column({ type: 'text' })
    comment: string;

    @OneToOne(() => User, { cascade: true })
    @JoinColumn({ name: 'userId' })
    user: User;
}