/* eslint-disable prettier/prettier */
/* archivo: src/sponsor/sponsor.entity.ts */
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import {ExhibitionEntity} from "../../exhibition/exhibition.entity/exhibition.entity";

@Entity()
export class SponsorEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    @Column()
    name: string;
    @Column()
    description: string;
    @Column()
    website: string;

    @OneToOne(() => ExhibitionEntity, exhibition => exhibition.sponsor)
    exhibition: ExhibitionEntity;

}
/* archivo: src/sponsor/sponsor.entity.ts */