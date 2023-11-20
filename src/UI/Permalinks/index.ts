import Helper from '../../Helper';
import styles from './styles.module.scss';
import './styles.scss';

/**
 * Display permalinks to embedded Google doc headers
 */
export default function Permalinks() {
  Helper.onGoogleDocEmbed<HTMLHeadingElement>(
    [...Array(5).keys()].map((level) => `h${level + 1}:not([id=""])`).join(','),
    (headers) => {
      if (!document.querySelector(`.${styles.permalink}`)) {
        headers.forEach((h) => {
          const a = document.createElement('a');
          a.append(Helper.fontAwesome(''));
          a.href = `#${h.id}`;
          a.className = styles.permalink;
          h.append(a);
          Helper.log(`added 🔗 ${h.innerText}`);
        });
      }
    }
  );
}
