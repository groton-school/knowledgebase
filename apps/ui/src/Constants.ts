const hosting = process.env.GOOGLE_HOSTING;
const bootstrap = { padding: 'p-3', margin: 'm-1' };

const styles = {
  googleDocEmbed: window
    .getComputedStyle(document.body)
    .getPropertyValue('--googleDocEmbed'),
  logo: window.getComputedStyle(document.body).getPropertyValue('--logo')
};

export default { hosting, styles, bootstrap };
