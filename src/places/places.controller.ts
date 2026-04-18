import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListBuildingsDto } from './dto/list-buildings.dto';
import { ListRoomsDto } from './dto/list-rooms.dto';
import { PlacesService } from './places.service';

@ApiTags('places')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('buildings')
  @ApiOperation({ summary: 'List imported buildings' })
  listBuildings(@Query() query: ListBuildingsDto) {
    return this.placesService.listBuildings(query);
  }

  @Get('buildings/:id')
  @ApiOperation({ summary: 'Get one building by id' })
  getBuildingById(@Param('id') id: string) {
    return this.placesService.getBuildingById(id);
  }

  @Get('buildings/:id/rooms')
  @ApiOperation({ summary: 'List imported rooms for one building' })
  listBuildingRooms(@Param('id') id: string) {
    return this.placesService.listBuildingRooms(id);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'List imported rooms' })
  listRooms(@Query() query: ListRoomsDto) {
    return this.placesService.listRooms(query);
  }
}
