import Helper from '../../Helper';
import './styles.scss';

/**
 * Display permalinks to embedded Google doc headers
 */
export default function Permalinks() {
  Helper.onGoogleDocEmbed<HTMLHeadingElement>(
    [...Array(5).keys()].map((level) => `h${level + 1}:not([id=""])`).join(','),
    (headers) => {
      const permalink = window
        .getComputedStyle(document.body)
        .getPropertyValue('--ui-permalinks-permalink');
      if (!document.querySelector(`.${permalink}`)) {
        headers.forEach((h) => {
          const a = document.createElement('a');
          a.append('🔗');
          a.href = `#${h.id}`;
          a.className = permalink;
          h.append(a);
          Helper.log(`added 🔗 ${h.innerText}`);
        });
      }
    }
  );
}
