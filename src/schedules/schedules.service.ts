import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import { DataSource, ILike, Repository } from 'typeorm';
import { AuthProvider } from '../common/enums/auth-provider.enum';
import {
  normalizeSearchText,
  resolveBuildingFromLocationHint,
} from '../common/utils/building-matching.util';
import { Building } from '../places/entities/building.entity';
import { ScheduleSourceType } from '../common/enums/schedule-source-type.enum';
import { Room } from '../places/entities/room.entity';
import { User } from '../users/entities/user.entity';
import { ImportScheduleDto } from './dto/import-schedule.dto';
import { ListSchedulesDto } from './dto/list-schedules.dto';
import { Instructor } from './entities/instructor.entity';
import { RecurrenceRule } from './entities/recurrence-rule.entity';
import { Schedule } from './entities/schedule.entity';
import { ScheduledClass } from './entities/scheduled-class.entity';
import { IcsParserService } from './ics-parser.service';
import {
  ParsedIcsEvent,
  ParsedIcsLocation,
} from './interfaces/parsed-ics.interface';
import { resolveScheduledClassDestination } from './utils/class-destination.util';

interface ScheduleImportContext {
  scheduleRepository: Repository<Schedule>;
  scheduledClassRepository: Repository<ScheduledClass>;
  recurrenceRuleRepository: Repository<RecurrenceRule>;
  instructorRepository: Repository<Instructor>;
  userRepository: Repository<User>;
  roomRepository: Repository<Room>;
  buildings: Building[];
  rooms: Room[];
  instructorCache: Map<string, Instructor>;
}

interface ScheduleImportSourceMetadata {
  sourceType?: ScheduleSourceType;
  sourceUrl?: string | null;
  sourceFileName?: string | null;
  sourceStoragePath?: string | null;
  sourceStorageProvider?: string | null;
  sourceStorageBucket?: string | null;
  isDefaultSample?: boolean;
}

interface ImportScheduleForUserOptions extends ScheduleImportSourceMetadata {
  fileBuffer?: Buffer;
  fileName?: string;
  icsContent?: string;
}

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(ScheduledClass)
    private readonly scheduledClassRepository: Repository<ScheduledClass>,
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
    private readonly icsParserService: IcsParserService,
    private readonly dataSource: DataSource,
  ) {}

  async importSchedule(
    dto: ImportScheduleDto,
    fileBuffer?: Buffer,
    fileName?: string,
  ) {
    const sanitizedDto = this.sanitizeImportDto(dto);
    const user = await this.resolveUser(
      sanitizedDto,
      this.dataSource.getRepository(User),
    );

    return this.importScheduleForUser(user, sanitizedDto, {
      fileBuffer,
      fileName,
      sourceType: ScheduleSourceType.ICS_UPLOAD,
      sourceUrl: sanitizedDto.sourceUrl ?? null,
      sourceFileName: fileName?.trim() || null,
      isDefaultSample: false,
    });
  }

  async importDefaultSchedule(dto: ImportScheduleDto) {
    const defaultContent = await this.readDefaultIcsFile();
    const sanitizedDto = this.sanitizeImportDto(dto);
    const user = await this.resolveUser(
      sanitizedDto,
      this.dataSource.getRepository(User),
    );

    return this.importScheduleForUser(
      user,
      {
        ...sanitizedDto,
        icsContent: undefined,
      },
      {
        icsContent: defaultContent,
        fileName: 'SEGUNDO SEMESTRE 2026.ics',
        sourceType: ScheduleSourceType.DEFAULT_SAMPLE,
        sourceFileName: 'SEGUNDO SEMESTRE 2026.ics',
        isDefaultSample: true,
      },
    );
  }

  async importScheduleForUser(
    user: User,
    dto: ImportScheduleDto,
    options: ImportScheduleForUserOptions = {},
  ) {
    const sanitizedDto = this.sanitizeImportDto(dto);
    const rawIcsContent =
      options.icsContent ??
      (await this.resolveIcsContent(sanitizedDto, options.fileBuffer));
    const parsedCalendar = this.icsParserService.parse(rawIcsContent);

    if (parsedCalendar.events.length === 0) {
      throw new BadRequestException(
        'The provided .ics file did not contain any class events.',
      );
    }

    const replaceExisting = this.parseBoolean(sanitizedDto.replaceExisting);
    const scheduleName =
      sanitizedDto.name?.trim() ??
      options.fileName?.replace(/\.ics$/i, '').trim() ??
      'Imported schedule';
    const scheduleId = await this.dataSource.transaction(async (manager) => {
      const context: ScheduleImportContext = {
        scheduleRepository: manager.getRepository(Schedule),
        scheduledClassRepository: manager.getRepository(ScheduledClass),
        recurrenceRuleRepository: manager.getRepository(RecurrenceRule),
        instructorRepository: manager.getRepository(Instructor),
        userRepository: manager.getRepository(User),
        roomRepository: manager.getRepository(Room),
        buildings: await manager.getRepository(Building).find(),
        rooms: await manager.getRepository(Room).find({
          relations: {
            building: true,
          },
        }),
        instructorCache: new Map<string, Instructor>(),
      };

      if (replaceExisting) {
        await this.deleteExistingSchedule(
          user.id,
          scheduleName,
          context.scheduleRepository,
        );
      }

      const now = new Date();
      const schedule = await context.scheduleRepository.save(
        context.scheduleRepository.create({
          user,
          name: scheduleName,
          timezone: sanitizedDto.timezone?.trim() || parsedCalendar.timezone,
          sourceType: options.sourceType ?? ScheduleSourceType.ICS_UPLOAD,
          sourceUrl: options.sourceUrl ?? sanitizedDto.sourceUrl?.trim() ?? null,
          sourceFileName:
            options.sourceFileName ?? options.fileName?.trim() ?? null,
          sourceStoragePath: options.sourceStoragePath ?? null,
          sourceStorageProvider: options.sourceStorageProvider ?? null,
          sourceStorageBucket: options.sourceStorageBucket ?? null,
          isDefaultSample: options.isDefaultSample ?? false,
          importedAt: now,
          lastUpdatedAt: now,
        }),
      );

      for (const parsedEvent of parsedCalendar.events) {
        const savedClass = await this.createScheduledClass(
          schedule,
          parsedEvent,
          context,
        );

        if (parsedEvent.recurrenceRule) {
          await context.recurrenceRuleRepository.save(
            context.recurrenceRuleRepository.create({
              frequency: parsedEvent.recurrenceRule.frequency,
              interval: parsedEvent.recurrenceRule.interval,
              byDay: parsedEvent.recurrenceRule.byDay,
              untilDate: parsedEvent.recurrenceRule.untilDate,
              timezone: parsedEvent.recurrenceRule.timezone,
              scheduledClass: savedClass,
            }),
          );
        }
      }

      return schedule.id;
    });

    return this.getScheduleById(scheduleId);
  }

  async getDefaultIcsFileContent() {
    return this.readDefaultIcsFile();
  }

  async listSchedules(query: ListSchedulesDto) {
    const whereClause = query.userId
      ? { user: { id: query.userId } }
      : query.userEmail
        ? { user: { email: query.userEmail } }
        : undefined;

    return this.scheduleRepository.find({
      where: whereClause,
      relations: {
        user: true,
        classes: {
          room: {
            building: true,
          },
          instructors: true,
          recurrenceRule: true,
        },
      },
      order: {
        importedAt: 'DESC',
        classes: {
          startsAt: 'ASC',
        },
      },
    });
  }

  async getScheduleById(id: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: {
        user: true,
        classes: {
          room: {
            building: true,
          },
          instructors: true,
          recurrenceRule: true,
        },
      },
      order: {
        classes: {
          startsAt: 'ASC',
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with id "${id}" was not found.`);
    }

    return schedule;
  }

  async listSchedulesForUser(userId: string) {
    return this.listSchedules({
      userId,
    });
  }

  async getLatestScheduleForUser(userId: string) {
    const latestSchedule = await this.scheduleRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        user: true,
        classes: {
          room: {
            building: true,
          },
          instructors: true,
          recurrenceRule: true,
        },
      },
      order: {
        importedAt: 'DESC',
        createdAt: 'DESC',
        classes: {
          startsAt: 'ASC',
        },
      },
    });

    if (!latestSchedule) {
      throw new NotFoundException(
        'The current user does not have an imported schedule yet.',
      );
    }

    return latestSchedule;
  }

  async listCurrentScheduleClassesForUser(userId: string) {
    const latestSchedule = await this.getLatestScheduleForUser(userId);
    return this.listScheduleClasses(latestSchedule.id);
  }

  async getNextClassForUser(userId: string, referenceDate = new Date()) {
    const latestSchedule = await this.getLatestScheduleForUser(userId);
    const buildings = await this.buildingRepository.find();
    const nextClass = (latestSchedule.classes ?? [])
      .filter((scheduledClass) => scheduledClass.endsAt >= referenceDate)
      .sort(
        (leftClass, rightClass) =>
          leftClass.startsAt.getTime() - rightClass.startsAt.getTime(),
      )[0];

    if (!nextClass) {
      return null;
    }

    return this.mapScheduledClassWithDestination(nextClass, buildings);
  }

  async listTodayClassesForUser(userId: string, referenceDate = new Date()) {
    const latestSchedule = await this.getLatestScheduleForUser(userId);
    const buildings = await this.buildingRepository.find();
    const timezone = latestSchedule.timezone || 'America/Bogota';
    const targetDate = this.formatDateInTimeZone(referenceDate, timezone);

    return (latestSchedule.classes ?? [])
      .filter((scheduledClass) => {
        const classTimezone = scheduledClass.timezone || timezone;
        return (
          this.formatDateInTimeZone(scheduledClass.startsAt, classTimezone) ===
          targetDate
        );
      })
      .map((scheduledClass) =>
        this.mapScheduledClassWithDestination(scheduledClass, buildings),
      );
  }

  async listScheduleClasses(scheduleId: string) {
    const schedule = await this.getScheduleById(scheduleId);
    const buildings = await this.buildingRepository.find();

    return (schedule.classes ?? []).map((scheduledClass) =>
      this.mapScheduledClassWithDestination(scheduledClass, buildings),
    );
  }

  async getScheduledClassById(classId: string) {
    const scheduledClass = await this.scheduledClassRepository.findOne({
      where: { id: classId },
      relations: {
        schedule: true,
        room: {
          building: true,
        },
        instructors: true,
        recurrenceRule: true,
      },
    });

    if (!scheduledClass) {
      throw new NotFoundException(
        `Scheduled class with id "${classId}" was not found.`,
      );
    }

    const buildings = await this.buildingRepository.find();

    return this.mapScheduledClassWithDestination(scheduledClass, buildings);
  }

  async getScheduledClassByIdForUser(userId: string, classId: string) {
    const scheduledClass = await this.scheduledClassRepository.findOne({
      where: {
        id: classId,
        schedule: {
          user: {
            id: userId,
          },
        },
      },
      relations: {
        schedule: true,
        room: {
          building: true,
        },
        instructors: true,
        recurrenceRule: true,
      },
    });

    if (!scheduledClass) {
      throw new NotFoundException(
        `Scheduled class with id "${classId}" was not found for the current user.`,
      );
    }

    const buildings = await this.buildingRepository.find();
    return this.mapScheduledClassWithDestination(scheduledClass, buildings);
  }

  private async createScheduledClass(
    schedule: Schedule,
    parsedEvent: ParsedIcsEvent,
    context: ScheduleImportContext,
  ) {
    const instructors = await this.resolveInstructors(
      parsedEvent.instructors,
      context,
    );
    const room = await this.resolveRoom(parsedEvent.location, context);

    return context.scheduledClassRepository.save(
      context.scheduledClassRepository.create({
        schedule,
        title: parsedEvent.title,
        courseCode: parsedEvent.courseCode ?? null,
        section: parsedEvent.section ?? null,
        nrc: parsedEvent.nrc ?? null,
        startsAt: parsedEvent.startsAt,
        endsAt: parsedEvent.endsAt,
        timezone: parsedEvent.timezone,
        externalUid: parsedEvent.uid ?? null,
        rawLocation: parsedEvent.location?.raw ?? null,
        rawDescription: parsedEvent.description ?? null,
        room,
        instructors,
      }),
    );
  }

  private async resolveUser(
    dto: ImportScheduleDto,
    userRepository: Repository<User>,
  ) {
    const sanitizedDto = this.sanitizeImportDto(dto);

    if (sanitizedDto.userId) {
      const existingUser = await userRepository.findOne({
        where: { id: sanitizedDto.userId },
      });

      if (!existingUser) {
        throw new NotFoundException(
          `User with id "${sanitizedDto.userId}" was not found.`,
        );
      }

      return existingUser;
    }

    if (!sanitizedDto.userEmail?.trim()) {
      throw new BadRequestException(
        'userId or userEmail is required to import a schedule.',
      );
    }

    const email = sanitizedDto.userEmail.trim().toLowerCase();
    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      return existingUser;
    }

    return userRepository.save(
      userRepository.create({
        email,
        authProvider: sanitizedDto.authProvider ?? AuthProvider.MICROSOFT,
      }),
    );
  }

  private async resolveIcsContent(
    dto: ImportScheduleDto,
    fileBuffer?: Buffer,
  ): Promise<string> {
    const sanitizedDto = this.sanitizeImportDto(dto);

    if (sanitizedDto.icsContent?.trim()) {
      return sanitizedDto.icsContent;
    }

    if (fileBuffer?.length) {
      return fileBuffer.toString('utf8');
    }

    throw new BadRequestException(
      'Provide icsContent in the body or upload a .ics file.',
    );
  }

  private async resolveInstructors(
    instructorNames: string[],
    context: ScheduleImportContext,
  ) {
    const instructors: Instructor[] = [];

    for (const fullName of instructorNames) {
      const normalizedName = fullName.trim();
      const cacheKey = normalizeSearchText(normalizedName);

      if (!normalizedName) {
        continue;
      }

      const cachedInstructor = context.instructorCache.get(cacheKey);

      if (cachedInstructor) {
        instructors.push(cachedInstructor);
        continue;
      }

      const existingInstructor = await context.instructorRepository.findOne({
        where: { fullName: ILike(normalizedName) },
      });

      if (existingInstructor) {
        context.instructorCache.set(cacheKey, existingInstructor);
        instructors.push(existingInstructor);
        continue;
      }

      const savedInstructor = await context.instructorRepository.save(
        context.instructorRepository.create({
          fullName: normalizedName,
        }),
      );

      context.instructorCache.set(cacheKey, savedInstructor);
      instructors.push(savedInstructor);
    }

    return instructors;
  }

  private async resolveRoom(
    location: ParsedIcsLocation | undefined,
    context: ScheduleImportContext,
  ) {
    const roomCode = location?.roomCode?.trim();

    if (!roomCode) {
      return null;
    }

    const building = resolveBuildingFromLocationHint(
      {
        buildingName: location?.buildingName,
        roomCode,
      },
      context.buildings,
    );

    const matchedRoom = this.findBestRoomMatch(roomCode, building, context.rooms);

    if (matchedRoom) {
      let shouldPersist = false;

      if (!matchedRoom.building && building) {
        matchedRoom.building = building;
        shouldPersist = true;
      }

      if (!matchedRoom.name?.trim()) {
        matchedRoom.name = this.formatRoomDisplayName(roomCode);
        shouldPersist = true;
      }

      if (shouldPersist) {
        return this.persistRoom(matchedRoom, context);
      }

      return matchedRoom;
    }

    const savedRoom = await context.roomRepository.save(
      context.roomRepository.create({
        name: this.formatRoomDisplayName(roomCode),
        roomCode,
        building: building ?? null,
      }),
    );

    context.rooms.push(savedRoom);

    return savedRoom;
  }

  private async deleteExistingSchedule(
    userId: string,
    scheduleName: string,
    scheduleRepository: Repository<Schedule>,
  ) {
    const existingSchedule = await scheduleRepository.findOne({
      where: {
        user: { id: userId },
        name: scheduleName,
      },
    });

    if (existingSchedule) {
      await scheduleRepository.remove(existingSchedule);
    }
  }

  private parseBoolean(value?: boolean | string): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    return false;
  }

  private async readDefaultIcsFile() {
    const candidatePaths = [
      join(process.cwd(), 'src', 'utils', 'SEGUNDO SEMESTRE 2026.ics'),
      join(process.cwd(), 'dist', 'utils', 'SEGUNDO SEMESTRE 2026.ics'),
      join(process.cwd(), 'utils', 'SEGUNDO SEMESTRE 2026.ics'),
    ];

    for (const candidatePath of candidatePaths) {
      try {
        return await fs.readFile(candidatePath, 'utf8');
      } catch {
        continue;
      }
    }

    throw new NotFoundException(
      'Default .ics file was not found in src/utils or dist/utils.',
    );
  }

  private sanitizeImportDto(dto: ImportScheduleDto): ImportScheduleDto {
    return {
      ...dto,
      userId: this.normalizeOptionalString(dto.userId),
      userEmail: this.normalizeOptionalString(dto.userEmail),
      name: this.normalizeOptionalString(dto.name),
      timezone: this.normalizeOptionalString(dto.timezone),
      sourceUrl: this.normalizeOptionalString(dto.sourceUrl),
      icsContent: this.normalizeOptionalString(dto.icsContent),
    };
  }

  private normalizeOptionalString(value?: string) {
    const trimmed = value?.trim();

    if (!trimmed || trimmed.toLowerCase() === 'string') {
      return undefined;
    }

    return trimmed;
  }

  private findBestRoomMatch(
    roomCode: string,
    building: Building | undefined,
    rooms: Room[],
  ) {
    const rankedRooms = rooms
      .map((room) => ({
        room,
        score: this.scoreRoomMatch(room, roomCode, building),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score);

    return rankedRooms[0]?.room ?? null;
  }

  private scoreRoomMatch(
    room: Room,
    roomCode: string,
    building: Building | undefined,
  ) {
    const incomingFullCode = this.normalizeRoomCode(roomCode);
    const storedFullCode = this.normalizeRoomCode(room.roomCode);
    const incomingSuffix = this.extractRoomSuffix(roomCode, building);
    const storedSuffix = this.extractRoomSuffix(
      room.roomCode,
      room.building ?? building,
    );

    let bestScore = 0;

    if (incomingFullCode && storedFullCode && incomingFullCode === storedFullCode) {
      if (building && room.building?.id === building.id) {
        bestScore = 220;
      } else if (building && !room.building) {
        bestScore = 190;
      } else if (!building) {
        bestScore = 170;
      } else {
        bestScore = 140;
      }
    }

    if (incomingSuffix && storedSuffix && incomingSuffix === storedSuffix) {
      if (building && room.building?.id === building.id) {
        bestScore = Math.max(bestScore, 200);
      } else if (building && !room.building) {
        bestScore = Math.max(bestScore, 165);
      } else if (!building) {
        bestScore = Math.max(bestScore, 90);
      }
    }

    return bestScore;
  }

  private extractRoomSuffix(roomCode: string, building?: Building) {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const prefixes = [
      ...(building ? [building.code, ...(building.aliases ?? [])] : []),
      roomCode.trim().split(/[_ -]/)[0],
    ]
      .map((value) => normalizeSearchText(value).replace(/\s+/g, ''))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    for (const prefix of prefixes) {
      if (
        normalizedRoomCode.startsWith(prefix) &&
        normalizedRoomCode.length > prefix.length
      ) {
        return normalizedRoomCode.slice(prefix.length);
      }
    }

    return undefined;
  }

  private normalizeRoomCode(roomCode: string) {
    return normalizeSearchText(roomCode).replace(/\s+/g, '');
  }

  private formatRoomDisplayName(roomCode: string) {
    return roomCode.trim().replace(/[_-]+/g, ' ');
  }

  private formatDateInTimeZone(date: Date, timeZone: string) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(date);
  }

  private mapScheduledClassWithDestination(
    scheduledClass: ScheduledClass,
    buildings: Building[],
  ) {
    return {
      ...scheduledClass,
      destination: resolveScheduledClassDestination(scheduledClass, buildings),
    };
  }

  private async persistRoom(room: Room, context: ScheduleImportContext) {
    const savedRoom = await context.roomRepository.save(room);
    const roomIndex = context.rooms.findIndex(
      (existingRoom) => existingRoom.id === savedRoom.id,
    );

    if (roomIndex >= 0) {
      context.rooms[roomIndex] = savedRoom;
    } else {
      context.rooms.push(savedRoom);
    }

    return savedRoom;
  }
}
