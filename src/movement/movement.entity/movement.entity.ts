/* eslint-disable prettier/prettier */
/* archivo: src/movement/movement.entity.ts */
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import {ArtistEntity} from "../../artist/artist.entity/artist.entity";

@Entity()
export class MovementEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    @Column()
    name: string;
    @Column()
    description: string;

    @Column()
    countryOfOrigin: string;

    @ManyToMany(() => ArtistEntity, artist => artist.movements)
    @JoinTable()
    artists: ArtistEntity[];
}
/* archivo: src/movement/movement.entity.ts */