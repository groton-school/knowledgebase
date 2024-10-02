export default function Head() {
  document.head.insertAdjacentHTML(
    'afterbegin',
    `
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${document.querySelector(`.title`)?.textContent}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">`
  );
}
