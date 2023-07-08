import Helper from '../Helper';

export default function MissingImages() {
  Helper.onGoogleDocEmbed<HTMLImageElement>('img', (images) => {
    images.map((img) =>
      img.addEventListener('error', (...args) =>
        console.error(
          `error loading ${img.src
          }: ${args.toString()} (this probably means that you need to sign in to your Google account and/or enabel third-party cookies.)`
        )
      )
    );
  });
}
