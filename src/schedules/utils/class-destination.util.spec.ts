import { resolveScheduledClassDestination } from './class-destination.util';

describe('resolveScheduledClassDestination', () => {
  const buildings = [
    {
      id: 'building-ml',
      code: 'ML',
      name: 'Mario Laserna',
      aliases: ['EDIF MARIO LASERNA'],
    },
    {
      id: 'building-rgd',
      code: 'RGD',
      name: 'Centro Civico',
      aliases: ['CENTRO CIVICO'],
    },
  ];

  it('resolves a building from the Uniandes raw location text', () => {
    const destination = resolveScheduledClassDestination(
      {
        id: 'class-1',
        title: 'Algoritmos',
        startsAt: new Date('2026-08-10T08:00:00.000Z'),
        endsAt: new Date('2026-08-10T09:20:00.000Z'),
        rawLocation: 'Edificio: Edif. Mario Laserna (ML) Salón: ML_340',
      },
      buildings,
    );

    expect(destination.isResolved).toBe(true);
    expect(destination.routeTarget).toBe('ML');
    expect(destination.routeTargetType).toBe('building');
    expect(destination.building).toMatchObject({
      id: 'building-ml',
      code: 'ML',
    });
    expect(destination.room).toMatchObject({
      roomCode: 'ML_340',
    });
  });

  it('falls back to the room prefix when there is no known building match', () => {
    const destination = resolveScheduledClassDestination(
      {
        id: 'class-2',
        title: 'Fisica',
        startsAt: new Date('2026-08-10T10:00:00.000Z'),
        endsAt: new Date('2026-08-10T11:20:00.000Z'),
        rawLocation: 'Salón: SD_201',
      },
      buildings,
    );

    expect(destination.isResolved).toBe(true);
    expect(destination.routeTarget).toBe('SD');
    expect(destination.routeTargetType).toBe('room-prefix');
    expect(destination.building).toBeNull();
    expect(destination.room).toMatchObject({
      roomCode: 'SD_201',
    });
  });
});
