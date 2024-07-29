export default function Head() {
  document.head.insertAdjacentHTML(
    'afterbegin',
    `
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${document.querySelector(`.title`)?.textContent}</title>
        `
  );
}
