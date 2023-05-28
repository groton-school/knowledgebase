import styles from './styles.module.scss';
import './styles.scss';

/**
 * Generate a FontAwesome icon from its glyph
 *
 * @see https://fontawesome.com/icons
 *
 * @param {string} glyph
 */
export default function fontAwesome(glyph: string) {
  const elt = document.createElement('i');
  elt.className = styles.fontAwesome;
  elt.setAttribute('data-before', glyph);
  return elt;
}
