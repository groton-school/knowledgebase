export function panel(id?: string): HTMLDivElement {
  const panel = document.createElement('div');
  if (id) {
    panel.id = id;
  }
  panel.className =
    'panel panel-default__ ______od-theme-inherit-borders-background-color od-theme-inherit-borders-border-width od-theme-inherit-borders-border-radius od-theme-inherit-borders-color od-theme-inherit-subnav-background-color';
  return panel;
}

export function heading(
  innerText: string,
  href: string,
  title?: string
): HTMLDivElement {
  const heading = document.createElement('div');
  heading.className = 'panel-heading text-uppercase';
  const a = document.createElement('a');
  a.href = href;
  if (title) {
    a.title = title;
  }
  a.innerText = innerText;
  heading.append(a);
  return heading;
}
