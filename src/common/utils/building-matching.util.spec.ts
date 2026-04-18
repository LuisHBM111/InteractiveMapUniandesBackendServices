import {
  normalizeSearchText,
  resolveBuildingFromLocationHint,
} from './building-matching.util';

describe('building-matching util', () => {
  const buildings = [
    {
      code: 'ML',
      name: 'Edificio Mario Laserna',
      aliases: ['ML'],
    },
    {
      code: 'O',
      name: 'Edificio Henry Yerly',
      aliases: ['O'],
    },
    {
      code: 'Q',
      name: 'Bloque Q - Medicina / Quimica',
      aliases: ['Q'],
    },
  ];

  it('normalizes text for accent-insensitive comparisons', () => {
    expect(normalizeSearchText('centro civico')).toBe(
      normalizeSearchText('centro civico'),
    );
    expect(normalizeSearchText('Mario   Laserna')).toBe('MARIO LASERNA');
  });

  it('matches a building using the Uniandes ICS building label and room code', () => {
    const matchedBuilding = resolveBuildingFromLocationHint(
      {
        buildingName: 'Edif. Mario Laserna (ML)',
        roomCode: 'ML_340',
      },
      buildings,
    );

    expect(matchedBuilding?.code).toBe('ML');
  });

  it('matches a building from the room prefix even when the name is short', () => {
    const matchedBuilding = resolveBuildingFromLocationHint(
      {
        buildingName: 'Bloque Q',
        roomCode: 'Q_307',
      },
      buildings,
    );

    expect(matchedBuilding?.code).toBe('Q');
  });

  it('does not force an unrelated building when the ICS building is unknown', () => {
    const matchedBuilding = resolveBuildingFromLocationHint(
      {
        buildingName: 'centro civico',
        roomCode: 'RGD_001',
      },
      buildings,
    );

    expect(matchedBuilding).toBeUndefined();
  });
});
