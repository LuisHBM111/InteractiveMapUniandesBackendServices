import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { extname, isAbsolute, relative, resolve } from 'path';

export function resolveProjectImportPath(
  filePath: string,
  expectedExtension: string,
) {
  const trimmedPath = filePath?.trim();

  if (!trimmedPath) {
    throw new BadRequestException('A valid filePath is required.');
  }

  if (extname(trimmedPath).toLowerCase() !== expectedExtension.toLowerCase()) {
    throw new BadRequestException(
      `Only ${expectedExtension} files are supported for filePath imports.`,
    );
  }

  const resolvedPath = resolve(trimmedPath);
  const allowedRoots = [
    resolve(process.cwd(), 'src', 'utils'),
    resolve(process.cwd(), 'dist', 'utils'),
    resolve(process.cwd(), 'utils'),
  ];

  const isAllowedPath = allowedRoots.some((rootPath) =>
    isPathInsideRoot(resolvedPath, rootPath),
  );

  if (!isAllowedPath) {
    throw new ForbiddenException(
      'For security, filePath imports are only allowed from this project utils directory. Upload the file instead.',
    );
  }

  return resolvedPath;
}

function isPathInsideRoot(targetPath: string, rootPath: string) {
  const relativePath = relative(rootPath, targetPath);

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !isAbsolute(relativePath))
  );
}
