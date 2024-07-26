import Helper from "../Helper";
import Constants from "../Constants";

export default function Redirect() {
    const googleDoc = document.querySelector(Constants.styles.googleDocEmbed) as HTMLDivElement;
    if (googleDoc && /^Redirect to https?:\/\//i.test(googleDoc.innerText)) {
        const a = googleDoc.querySelector('a');
        if (a) {
            let url = new URL(a.href);
            if (url.host == 'www.google.com') {
                const q = url.searchParams.get('q');
                if (q && /^https?:\/\//i.test(q)) {
                    url = new URL(q);
                }
            }
          Helper.log(`Redirecting to ${url.href}`);
          window.location.href = url.href;
          return true;
      }
    }
    return false;
}
