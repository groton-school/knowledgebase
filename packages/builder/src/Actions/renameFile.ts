import FileDescription from '../Models/FileDescription';
import { drive_v3 } from '@googleapis/drive';
import path from 'path';

export function selectiveRename({
  filePath,
  file,
  filename
}: {
  filePath: string;
  file: FileDescription;
  filename?: string;
}) {
  const result = path.join(
    filePath,
    convertToOverdriveStyle({ file, filename })
  );
  switch (path.extname(filename || '')) {
    case '.html':
      return result.replace(/^(.*)\/([^\/]+)\.html$/, '$1/index.html');
    default:
      return result;
  }
}

export function convertToOverdriveStyle({
  file,
  filename
}: {
  file: drive_v3.Schema$File;
  filename?: string;
}): string {
  return (
    file
      .name!.replace('&', 'and')
      .replace(/[^a-z0-9()!@*_+=;:,.]+/gi, '-')
      .toLowerCase() + (filename ? `/${filename}` : '')
  );
}
