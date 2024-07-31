import Helper from '../../Helper';
import './styles.scss';

function replace(needle: RegExp, replacement: string, haystack: Element) {
  if (haystack.children.length) {
    Array.from(haystack.children).forEach((node) =>
      replace(needle, replacement, node)
    );
  } else {
    const html = haystack as HTMLElement;
    html.innerText = html.innerText.replace(needle, replacement);
  }
}

export function label(link: HTMLAnchorElement) {
  for (const role of [
    'employees',
    'it',
    'teachers',
    'staff',
    'department-heads',
    'students'
  ]) {
    if (new RegExp(`for-${role}/$`).test(link.href)) {
      replace(new RegExp(` for ${role}$`, 'i'), '', link);
      link.insertAdjacentHTML(
        'beforeend',
        `<div class="badge rounded-pill ${role}"><span class="label"></span></div>
`
      );
      Helper.log(`Added ${role} label to ${link.href}`);
    }
  }
}

export default async function LinkLabelByGroup() {
  const anchors = await Helper.onSelectorReady<HTMLAnchorElement>('a');
  for (const anchor of anchors) {
    label(anchor);
  }
}
