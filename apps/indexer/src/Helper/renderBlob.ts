import ejs from 'ejs';

export async function renderBlob(filePath: string, data: ejs.Data) {
  return new Blob([await ejs.renderFile(filePath, data)], {
    type: 'text/html'
  });
}
