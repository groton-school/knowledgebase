export const hosting = process.env.GOOGLE_HOSTING;

export const bootstrap = { padding: 'p-3', margin: 'm-1' };

export const styles = {
  googleDocEmbed: window
    .getComputedStyle(document.body)
    .getPropertyValue('--googleDocEmbed'),
  logo: window.getComputedStyle(document.body).getPropertyValue('--logo')
};
