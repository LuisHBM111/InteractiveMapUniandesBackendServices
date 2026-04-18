import {
  BuildingLike,
  resolveBuildingFromLocationHint,
} from '../../common/utils/building-matching.util';

export interface RoomLike {
  id?: string;
  name?: string;
  roomCode: string;
  building?: BuildingLike & { id?: string } | null;
}

export interface ScheduledClassLike {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  rawLocation?: string | null;
  room?: RoomLike | null;
}

export interface ResolvedClassDestination {
  room: {
    id?: string;
    name?: string;
    roomCode: string;
  } | null;
  building: {
    id?: string;
    code: string;
    name: string;
  } | null;
  routeTarget: string | null;
  routeTargetType: 'building' | 'room-prefix' | null;
  isResolved: boolean;
}

export function resolveScheduledClassDestination<T extends BuildingLike & { id?: string }>(
  scheduledClass: ScheduledClassLike,
  buildings: T[],
): ResolvedClassDestination {
  const parsedLocation = parseRawLocation(scheduledClass.rawLocation);
  const roomCode = scheduledClass.room?.roomCode ?? parsedLocation.roomCode;
  const building =
    scheduledClass.room?.building ??
    resolveBuildingFromLocationHint(
      {
        buildingName: parsedLocation.buildingName,
        roomCode,
      },
      buildings,
    ) ??
    null;
  const routeTarget = building?.code ?? extractRoomPrefix(roomCode) ?? null;

  return {
    room: roomCode
      ? {
          id: scheduledClass.room?.id,
          name: scheduledClass.room?.name,
          roomCode,
        }
      : null,
    building: building
      ? {
          id: 'id' in building ? building.id : undefined,
          code: building.code,
          name: building.name,
        }
      : null,
    routeTarget,
    routeTargetType: building
      ? 'building'
      : routeTarget
        ? 'room-prefix'
        : null,
    isResolved: Boolean(routeTarget),
  };
}

export function parseRawLocation(rawLocation?: string | null) {
  if (!rawLocation?.trim()) {
    return {};
  }

  const buildingName =
    rawLocation.match(/Edificio:\s*(.+?)(?=\s+Sal[oóÃ]n:|$)/i)?.[1]?.trim() ??
    undefined;
  const roomCode =
    rawLocation.match(/Sal[oóÃ]n:\s*([A-Za-z0-9_ -]+)/i)?.[1]?.trim() ??
    undefined;

  return {
    buildingName,
    roomCode,
  };
}

function extractRoomPrefix(roomCode?: string) {
  if (!roomCode?.trim()) {
    return undefined;
  }

  return roomCode.trim().toUpperCase().match(/^([A-Z]+[A-Z0-9]*)(?=[_\- ])/)
    ?.[1];
}
