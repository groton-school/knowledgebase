import { JSDOM } from 'jsdom';
import File from '../File.js';

// TODO pipelineHTML needs a re-think

type PipelineFunction = (params: { file: File; html: string }) => string;

const injectGoogleDocId: PipelineFunction = ({ file, html }) => {
  return html.replace(
    '<style',
    `<meta item-prop="kb.id" content="${file.id}" />
    ${file.webViewLink ? `<meta item-prop="kb.webViewLink" content="${file.webViewLink}" />` : ''}<style`
  );
};

const demoteBodyToDiv: PipelineFunction = ({ html }) => {
  return html
    .replace('<body', '<body><div')
    .replace('</body>', `</div></body>`)
    .replace('class="doc-content"', 'id="doc-content" class="doc-content"');
};

// FIXME decouple and use config.json
const injectAssets: PipelineFunction = ({ html }) => {
  return html
    .replace(
      '<head>',
      '<head><link rel="icon" href="/static/_site/favicon.ico">'
    )
    .replace(
      '</head>',
      `<link rel="stylesheet" href="/assets/ui.css" /></head>`
    )
    .replace('</body>', `<script src="/assets/ui.js"></script></body>`);
};

const injectTitle: PipelineFunction = ({ file, html }) => {
  return html.replace('<head>', `<head><title>${file.name}</title>`);
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
  file: File;
  blob: Blob;
}): Promise<Blob> {
  if (blob.type?.startsWith('text/html')) {
    let html = await blob.text();
    for (const processor of [
      removeScripts,
      demoteBodyToDiv,
      injectGoogleDocId,
      injectTitle,
      injectAssets
    ]) {
      html = processor({ file, html });
    }
    return new Blob([html], { type: blob.type });
  }
  return blob;
}
export default pipelineHTML;
