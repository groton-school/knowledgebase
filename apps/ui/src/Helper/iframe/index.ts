import './styles.scss';
import styles from './styles.scss';

/**
 * Create a standardized iframe DOM element
 * @param {string} src
 * @param {string} allow (Optional)
 * @param {boolean} display=true (Optional)
 */
export default function iframe(src: string, allow?: string, display = true) {
  const elt: HTMLIFrameElement = document.createElement('iframe');
  elt.src = src;
  elt.className = styles.frame;
  allow && (elt.allow = allow);
  !display && (elt.style.display = 'none');
  return elt;
}
