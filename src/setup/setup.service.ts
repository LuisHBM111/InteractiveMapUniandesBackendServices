import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import { ImportBuildingsDto } from '../places/dto/import-buildings.dto';
import { PlacesService } from '../places/places.service';
import { ImportGraphDto } from '../routes/dto/import-graph.dto';
import { RoutesService } from '../routes/routes.service';
import { SeedCampusDataDto } from './dto/seed-campus-data.dto';

@Injectable()
export class SetupService {
  constructor(
    private readonly placesService: PlacesService,
    private readonly routesService: RoutesService,
  ) {}

  async seedDefaultCampusData(dto: SeedCampusDataDto) {
    const buildingsFilePath =
      dto.buildingsFilePath?.trim() ||
      this.resolveBundledFilePath('edificios_y_casas.xlsx');
    const graphFilePath =
      dto.graphFilePath?.trim() || this.resolveBundledFilePath('move.xlsx');

    const [buildingsResult, graphResult] = await Promise.all([
      this.placesService.importBuildings({
        filePath: buildingsFilePath,
        replaceExisting: dto.replaceExisting ?? true,
      }),
      this.routesService.importCampusGraph({
        filePath: graphFilePath,
        replaceExisting: dto.replaceExisting ?? true,
        bidirectional: dto.bidirectional ?? true,
      }),
    ]);

    return {
      files: {
        buildingsFilePath,
        graphFilePath,
      },
      buildings: buildingsResult,
      graph: graphResult,
    };
  }

  async importBuildings(dto: ImportBuildingsDto, fileBuffer?: Buffer) {
    return this.placesService.importBuildings(dto, fileBuffer);
  }

  async importCampusGraph(dto: ImportGraphDto, fileBuffer?: Buffer) {
    return this.routesService.importCampusGraph(dto, fileBuffer);
  }

  private resolveBundledFilePath(fileName: string) {
    const candidatePaths = [
      join(process.cwd(), 'src', 'utils', fileName),
      join(process.cwd(), 'dist', 'utils', fileName),
      join(process.cwd(), 'utils', fileName),
    ];

    for (const candidatePath of candidatePaths) {
      if (existsSync(candidatePath)) {
        return candidatePath;
      }
    }

    throw new NotFoundException(
      `Bundled setup file "${fileName}" was not found in src/utils, dist/utils or utils.`,
    );
  }
}
