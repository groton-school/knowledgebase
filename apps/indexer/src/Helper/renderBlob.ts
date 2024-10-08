import ejs from 'ejs';

export default async function renderBlob(
  filePath: string,
  data: Record<string, any>
) {
  return new Blob([await ejs.renderFile(filePath, data)], {
    type: 'text/html'
  });
}
