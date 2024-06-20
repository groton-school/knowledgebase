import FileDescription from '../Models/FileDescription';
import { JSDOM } from 'jsdom';

type PipelineFunction = (params: {
  file: FileDescription;
  html: string;
}) => string;

const injectGoogleDocId: PipelineFunction = ({ file, html }) => {
  return html.replace(
    '<style',
    `<meta item-prop="kb.id" content="${file.id}" /><style`
  );
};

const demoteBodyToDiv: PipelineFunction = ({ html }) => {
  return html
    .replace('<body', '<body><div')
    .replace('</body>', `</div></body>`);
};

const injectAssets: PipelineFunction = ({ html }) => {
  return html
    .replace('<head>', '<head><link rel="icon" href="/assets/favicon.ico">')
    .replace(
      '</head>',
      `<link rel="stylesheet" href="/assets/kb.css" /></head>`
    )
    .replace('</body>', `<script src="/assets/kb.js"></script></body>`);
};

const removeScripts: PipelineFunction = ({ html }) => {
  const dom = new JSDOM(html);
  Array.from(dom.window.document.querySelectorAll('script')).forEach((s) =>
    s.remove()
  );
  return dom.window.document.documentElement.outerHTML;
};

async function pipelineHTML({
  file,
  blob
}: {
  file: FileDescription;
  blob: Blob;
}): Promise<Blob> {
  if (blob.type?.startsWith('text/html')) {
    let html = await blob.text();
    for (const processor of [
      removeScripts,
      demoteBodyToDiv,
      injectGoogleDocId,
      injectAssets
    ]) {
      html = processor({ file, html });
    }
    return new Blob([html], { type: blob.type });
  }
  return blob;
}
export default pipelineHTML;
