import './styles.scss';

/**
 * Create a standardized iframe DOM element
 *
 * @param {string} src
 * @param {string} allow (Optional)
 * @param {boolean} display=true (Optional)
 */
export function iframe(src: string, allow?: string, display = true) {
  const elt: HTMLIFrameElement = document.createElement('iframe');
  elt.src = src;
  elt.className = window
    .getComputedStyle(document.body)
    .getPropertyValue('--helper-iframe-iframe');
  allow && (elt.allow = allow);
  !display && (elt.style.display = 'none');
  return elt;
}
