import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthProvider } from '../common/enums/auth-provider.enum';
import { ImportScheduleDto } from './dto/import-schedule.dto';
import { ListSchedulesDto } from './dto/list-schedules.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'List schedules' })
  listSchedules(@Query() query: ListSchedulesDto) {
    return this.schedulesService.listSchedules(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one schedule by id' })
  getScheduleById(@Param('id') id: string) {
    return this.schedulesService.getScheduleById(id);
  }

  @Get(':id/classes')
  @ApiOperation({ summary: 'List one schedule classes with resolved destinations' })
  listScheduleClasses(@Param('id') id: string) {
    return this.schedulesService.listScheduleClasses(id);
  }

  @Get('classes/:classId')
  @ApiOperation({ summary: 'Get one class with its resolved destination' })
  getScheduledClassById(@Param('classId') classId: string) {
    return this.schedulesService.getScheduledClassById(classId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import a schedule from raw .ics content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'demo@uniandes.edu.co' },
        authProvider: { type: 'string', enum: Object.values(AuthProvider) },
        name: { type: 'string', example: 'Horario semestre 2' },
        timezone: { type: 'string', example: 'America/Bogota' },
        replaceExisting: { type: 'boolean', example: true },
        icsContent: {
          type: 'string',
          example: 'BEGIN:VCALENDAR\\nBEGIN:VEVENT\\n...',
        },
      },
      required: ['userEmail', 'icsContent'],
    },
  })
  importFromBody(@Body() dto: ImportScheduleDto) {
    return this.schedulesService.importSchedule(dto);
  }

  @Post('import/default')
  @ApiOperation({ summary: 'Import the default sample .ics file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'demo@uniandes.edu.co' },
        authProvider: { type: 'string', enum: Object.values(AuthProvider) },
        name: { type: 'string', example: 'Horario semestre 2' },
        timezone: { type: 'string', example: 'America/Bogota' },
        replaceExisting: { type: 'boolean', example: true },
      },
      required: ['userEmail'],
      example: {
        userEmail: 'demo@uniandes.edu.co',
        name: 'Horario semestre 2',
        replaceExisting: true,
      },
    },
  })
  importFromDefaultFile(@Body() dto: ImportScheduleDto) {
    return this.schedulesService.importDefaultSchedule(dto);
  }

  @Post('import/file')
  @ApiOperation({ summary: 'Import a schedule from an uploaded .ics file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        userId: { type: 'string' },
        userEmail: { type: 'string' },
        authProvider: { type: 'string', enum: Object.values(AuthProvider) },
        name: { type: 'string' },
        timezone: { type: 'string' },
        sourceUrl: { type: 'string' },
        replaceExisting: { type: 'boolean' },
      },
      required: ['file'],
      example: {
        userEmail: 'demo@uniandes.edu.co',
        name: 'Horario semestre 2',
        timezone: 'America/Bogota',
        replaceExisting: true,
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  importFromUploadedFile(
    @UploadedFile() file: { buffer?: Buffer; originalname?: string } | undefined,
    @Body() dto: ImportScheduleDto,
  ) {
    return this.schedulesService.importSchedule(
      dto,
      file?.buffer,
      file?.originalname,
    );
  }
}
