export default function iframe(src: string, allow?: string, display = true) {
  const elt: HTMLIFrameElement = document.createElement('iframe');
  elt.src = src;
  elt.width = '100%';
  elt.height = '315';
  elt.frameBorder = '0';
  elt.scrolling = 'no';
  allow && (elt.allow = allow);
  !display && (elt.style.display = 'none');
  return elt;
}
