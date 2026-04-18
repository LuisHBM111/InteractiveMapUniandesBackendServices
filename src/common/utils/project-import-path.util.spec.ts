import {
  resolveProjectImportPath,
} from './project-import-path.util';

describe('project-import-path util', () => {
  it('allows workbook paths inside src/utils', () => {
    const resolvedPath = resolveProjectImportPath(
      'src/utils/move.xlsx',
      '.xlsx',
    );

    expect(resolvedPath).toContain('src');
    expect(resolvedPath).toContain('utils');
    expect(resolvedPath.endsWith('move.xlsx')).toBe(true);
  });

  it('rejects workbook paths outside the project utils directory', () => {
    expect(() =>
      resolveProjectImportPath('../outside.xlsx', '.xlsx'),
    ).toThrow('For security');
  });
});
