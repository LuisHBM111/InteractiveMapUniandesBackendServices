import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { DataSource, Repository } from 'typeorm';
import { normalizeSearchText } from '../common/utils/building-matching.util';
import { resolveProjectImportPath } from '../common/utils/project-import-path.util';
import {
  CURATED_BUILDING_ALIASES,
  CURATED_BUILDING_SEEDS,
} from './constants/curated-building-data';
import { Building } from './entities/building.entity';
import { ImportBuildingsDto } from './dto/import-buildings.dto';
import { ListBuildingsDto } from './dto/list-buildings.dto';
import { ListRoomsDto } from './dto/list-rooms.dto';
import { Room } from './entities/room.entity';

interface BuildingRow {
  Codigo?: string;
  Edificio?: string;
  Ubicacion?: string;
}

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly dataSource: DataSource,
  ) {}

  async listBuildings(query: ListBuildingsDto) {
    const buildings = await this.buildingRepository.find({
      order: {
        code: 'ASC',
      },
    });

    const searchTerm = query.search?.trim();

    if (!searchTerm) {
      return buildings;
    }

    const normalizedSearch = this.normalizeText(searchTerm);

    return buildings.filter((building) => {
      const fields = [
        building.code,
        building.name,
        building.gridReference ?? '',
        ...(building.aliases ?? []),
      ];

      return fields.some((field) =>
        this.normalizeText(field).includes(normalizedSearch),
      );
    });
  }

  async getBuildingById(id: string) {
    const building = await this.buildingRepository.findOne({
      where: { id },
      relations: {
        rooms: true,
      },
    });

    if (!building) {
      throw new NotFoundException(`Building with id "${id}" was not found.`);
    }

    return building;
  }

  async listBuildingRooms(buildingId: string) {
    const building = await this.buildingRepository.findOne({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException(`Building with id "${buildingId}" was not found.`);
    }

    return this.roomRepository.find({
      where: {
        building: { id: buildingId },
      },
      relations: {
        building: true,
      },
      order: {
        roomCode: 'ASC',
      },
    });
  }

  async listRooms(query: ListRoomsDto) {
    const rooms = await this.roomRepository.find({
      where: query.buildingId
        ? {
            building: {
              id: query.buildingId,
            },
          }
        : undefined,
      relations: {
        building: true,
      },
      order: {
        roomCode: 'ASC',
      },
    });

    const searchTerm = query.search?.trim();

    if (!searchTerm) {
      return rooms;
    }

    const normalizedSearch = this.normalizeText(searchTerm);

    return rooms.filter((room) => {
      const fields = [
        room.roomCode,
        room.name,
        room.floor ?? '',
        room.building?.code ?? '',
        room.building?.name ?? '',
      ];

      return fields.some((field) =>
        this.normalizeText(field).includes(normalizedSearch),
      );
    });
  }

  async importBuildings(dto: ImportBuildingsDto, fileBuffer?: Buffer) {
    const rows = await this.readBuildingRows(dto.filePath, fileBuffer);
    const replaceExisting = this.parseBoolean(dto.replaceExisting);

    if (!rows.length) {
      throw new BadRequestException(
        'The provided workbook does not contain building rows.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const buildingRepository = manager.getRepository(Building);
      const existingBuildings = await buildingRepository.find();
      const savedBuildings: Building[] = [];

      for (const row of rows) {
        const rawCode = row.Codigo?.toString().trim();
        const rawName = row.Edificio?.toString().trim();

        if (!rawCode || !rawName) {
          continue;
        }

        const normalizedAliases = this.extractAliases(rawCode);
        const gridReference = this.normalizeGridReference(row.Ubicacion);
        const existingBuilding = this.findBuildingByCode(rawCode, existingBuildings);

        if (existingBuilding && !replaceExisting) {
          savedBuildings.push(existingBuilding);
          continue;
        }

        const building =
          existingBuilding ?? buildingRepository.create({ code: rawCode });

        building.code = rawCode;
        building.name = rawName;
        building.aliases = this.mergeAliases(rawCode, normalizedAliases);
        building.gridReference = gridReference;
        building.latitude = existingBuilding?.latitude ?? null;
        building.longitude = existingBuilding?.longitude ?? null;

        const savedBuilding = await buildingRepository.save(building);

        if (!existingBuilding) {
          existingBuildings.push(savedBuilding);
        }

        savedBuildings.push(savedBuilding);
      }

      for (const seed of CURATED_BUILDING_SEEDS) {
        const existingBuilding = this.findBuildingByCode(seed.code, existingBuildings);
        const building =
          existingBuilding ?? buildingRepository.create({ code: seed.code });

        building.code = seed.code;
        building.name = existingBuilding?.name ?? seed.name;
        building.aliases = this.mergeAliases(seed.code, [
          ...(existingBuilding?.aliases ?? []),
          ...(seed.aliases ?? []),
        ]);
        building.gridReference =
          existingBuilding?.gridReference ?? seed.gridReference ?? null;
        building.latitude = existingBuilding?.latitude ?? null;
        building.longitude = existingBuilding?.longitude ?? null;

        const savedBuilding = await buildingRepository.save(building);

        if (!existingBuilding) {
          existingBuildings.push(savedBuilding);
          savedBuildings.push(savedBuilding);
        }
      }

      return {
        importedCount: savedBuildings.length,
        buildings: savedBuildings,
      };
    });
  }

  private async readBuildingRows(filePath?: string, fileBuffer?: Buffer) {
    const workbook = new ExcelJS.Workbook();

    if (fileBuffer?.length) {
      await workbook.xlsx.read(Readable.from(fileBuffer));
    } else if (filePath) {
      await workbook.xlsx.readFile(
        resolveProjectImportPath(filePath, '.xlsx'),
      );
    } else {
      throw new BadRequestException(
        'Provide a valid filePath or upload an Excel file.',
      );
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return [];
    }

    const headerRow = worksheet.getRow(1);
    const headers = Array.from(
      { length: headerRow.cellCount },
      (_, index) => headerRow.getCell(index + 1).text.trim(),
    );

    const rows: BuildingRow[] = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const mappedRow: Record<string, string> = {};
      let hasValues = false;

      headers.forEach((header, index) => {
        if (!header) {
          return;
        }

        const value = row.getCell(index + 1).text.trim();
        mappedRow[header] = value;

        if (value) {
          hasValues = true;
        }
      });

      if (hasValues) {
        rows.push(mappedRow as BuildingRow);
      }
    }

    return rows;
  }

  private findBuildingByCode(code: string, buildings: Building[]) {
    const normalizedCode = this.normalizeText(code);

    return buildings.find((building) => {
      const aliases = [building.code, ...(building.aliases ?? [])];
      return aliases.some(
        (alias) => this.normalizeText(alias) === normalizedCode,
      );
    });
  }

  private extractAliases(rawCode: string) {
    const aliases = rawCode
      .split('/')
      .map((value) => value.trim())
      .filter(Boolean);

    return [...new Set([rawCode.trim(), ...aliases])];
  }

  private mergeAliases(code: string, aliases: string[]) {
    const curatedAliases = CURATED_BUILDING_ALIASES[code] ?? [];

    return [
      ...new Set(
        [code, ...aliases, ...curatedAliases]
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];
  }

  private normalizeGridReference(value?: string) {
    const trimmed = value?.toString().trim();

    if (!trimmed || trimmed === '-') {
      return null;
    }

    return trimmed;
  }

  private parseBoolean(value?: boolean | string) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    return false;
  }

  private normalizeText(value: string) {
    return normalizeSearchText(value);
  }
}
