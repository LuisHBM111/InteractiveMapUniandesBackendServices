export interface CuratedBuildingSeed {
  code: string;
  name: string;
  aliases?: string[];
  gridReference?: string | null;
}

export const CURATED_BUILDING_ALIASES: Record<string, string[]> = {
  ML: [
    'EDIF MARIO LASERNA',
    'EDIFICIO MARIO LASERNA',
    'MARIO LASERNA',
  ],
  O: [
    'EDIF HENRY YERLY',
    'EDIFICIO HENRY YERLY',
    'HENRY YERLY',
  ],
  Q: ['BLOQUE Q'],
};

export const CURATED_BUILDING_SEEDS: CuratedBuildingSeed[] = [
  {
    code: 'RGD',
    name: 'Centro Civico',
    aliases: ['CENTRO CIVICO', 'CENTRO CÍVICO', 'RGD'],
    gridReference: null,
  },
];
