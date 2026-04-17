/* eslint-disable prettier/prettier */
/* archivo: src/artwork/artwork.entity.ts */
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import {MuseumEntity} from "../../museum/museum.entity/museum.entity";
import {ExhibitionEntity} from "../../exhibition/exhibition.entity/exhibition.entity";
import {ImageEntity} from "../../image/image.entity/image.entity";
import {ArtistEntity} from "../../artist/artist.entity/artist.entity";

@Entity()
export class ArtworkEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;
    @Column()
    name: string;
    @Column()
    year: number;
    @Column()
    description: string;
    @Column()
    type: string;
    @Column()
    mainImage: string;

    @ManyToOne(() => MuseumEntity, museum => museum.artworks)
    museum: MuseumEntity;

    @ManyToOne(() => ExhibitionEntity, exhibition => exhibition.artworks)
    exhibition: ExhibitionEntity;

    @OneToMany(() => ImageEntity, image => image.artwork)
    images: ImageEntity[];

    @ManyToOne(() => ArtistEntity, artist => artist.artworks)
    artist: ArtistEntity;
}
/* archivo: src/artwork/artwork.entity.ts */