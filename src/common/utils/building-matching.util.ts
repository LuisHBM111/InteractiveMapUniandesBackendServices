export interface BuildingLike {
  code: string;
  name: string;
  aliases?: string[] | null;
}

export interface BuildingLocationHint {
  buildingName?: string;
  roomCode?: string;
}

const GENERIC_BUILDING_WORDS = new Set([
  'BLOQUE',
  'CAMPUS',
  'EDIF',
  'EDIFICIO',
  'PRINCIPAL',
]);

export function normalizeSearchText(value?: string) {
  if (!value?.trim()) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveBuildingFromLocationHint<T extends BuildingLike>(
  hint: BuildingLocationHint,
  buildings: T[],
) {
  if (buildings.length === 0) {
    return undefined;
  }

  const normalizedBuildingName = canonicalizeBuildingName(hint.buildingName);
  const simplifiedBuildingName = simplifyBuildingName(hint.buildingName);
  const exactIdentifiers = new Set<string>();

  for (const value of extractParenthesizedIdentifiers(hint.buildingName)) {
    exactIdentifiers.add(value);
  }

  const roomPrefix = extractRoomCodePrefix(hint.roomCode);
  if (roomPrefix) {
    exactIdentifiers.add(roomPrefix);
  }

  const rankedBuildings = buildings
    .map((building) => ({
      building,
      score: scoreBuildingAgainstHint(
        building,
        normalizedBuildingName,
        simplifiedBuildingName,
        exactIdentifiers,
      ),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  return rankedBuildings[0]?.building;
}

function scoreBuildingAgainstHint(
  building: BuildingLike,
  normalizedBuildingName: string,
  simplifiedBuildingName: string,
  exactIdentifiers: Set<string>,
) {
  const identifiers = getBuildingIdentifiers(building);
  let bestScore = 0;

  for (const identifier of exactIdentifiers) {
    if (identifiers.has(identifier)) {
      bestScore = Math.max(bestScore, 200);
    }
  }

  const canonicalName = canonicalizeBuildingName(building.name);
  const simplifiedName = simplifyBuildingName(building.name);

  if (
    normalizedBuildingName &&
    canonicalName &&
    normalizedBuildingName === canonicalName
  ) {
    bestScore = Math.max(bestScore, 170);
  }

  if (
    simplifiedBuildingName &&
    simplifiedName &&
    simplifiedBuildingName === simplifiedName
  ) {
    bestScore = Math.max(bestScore, 160);
  }

  if (
    normalizedBuildingName &&
    canonicalName &&
    (normalizedBuildingName.includes(canonicalName) ||
      canonicalName.includes(normalizedBuildingName))
  ) {
    bestScore = Math.max(bestScore, 130);
  }

  if (
    simplifiedBuildingName &&
    simplifiedName &&
    (simplifiedBuildingName.includes(simplifiedName) ||
      simplifiedName.includes(simplifiedBuildingName))
  ) {
    bestScore = Math.max(bestScore, 120);
  }

  return bestScore;
}

function getBuildingIdentifiers(building: BuildingLike) {
  return new Set(
    [building.code, ...(building.aliases ?? [])]
      .map((value) => normalizeSearchText(value))
      .filter(Boolean),
  );
}

function extractParenthesizedIdentifiers(value?: string) {
  if (!value?.trim()) {
    return [];
  }

  const identifiers: string[] = [];

  for (const match of value.matchAll(/\(([^)]+)\)/g)) {
    const normalized = normalizeSearchText(match[1]);
    if (normalized) {
      identifiers.push(normalized);
    }
  }

  return identifiers;
}

function extractRoomCodePrefix(roomCode?: string) {
  if (!roomCode?.trim()) {
    return undefined;
  }

  const prefixMatch = roomCode.trim().toUpperCase().match(/^([A-Z]+[A-Z0-9]*)(?=[_\- ])/);
  if (prefixMatch?.[1]) {
    return normalizeSearchText(prefixMatch[1]);
  }

  const compactMatch = roomCode.trim().toUpperCase().match(/^([A-Z]+[A-Z0-9]*)/);
  return compactMatch?.[1] ? normalizeSearchText(compactMatch[1]) : undefined;
}

function canonicalizeBuildingName(value?: string) {
  return normalizeSearchText(value)
    .replace(/\bEDIF\b/g, 'EDIFICIO')
    .replace(/\bBLOQ\b/g, 'BLOQUE')
    .trim();
}

function simplifyBuildingName(value?: string) {
  return canonicalizeBuildingName(value)
    .split(' ')
    .filter((word) => word && !GENERIC_BUILDING_WORDS.has(word))
    .join(' ')
    .trim();
}
