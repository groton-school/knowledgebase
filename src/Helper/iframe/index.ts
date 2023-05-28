import './styles.scss';

export default function iframe(src: string, allow?: string, display = true) {
  const elt: HTMLIFrameElement = document.createElement('iframe');
  elt.src = src;
  elt.className = 'kb-frame';
  allow && (elt.allow = allow);
  !display && (elt.style.display = 'none');
  return elt;
}
