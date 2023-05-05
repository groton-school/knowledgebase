let loading = false;

const waitForScript = (callback: () => void) => {
  if (gapi) {
    loading = false;
    gapi.load('client', () => {
      gapi.client
        .init({
          apiKey: process.env.GOOGLE_API_KEY,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
          ],
          clientId: process.env.GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.readonly'
        })
        .then(callback);
    });
  } else {
    setTimeout(waitForScript.bind(null, callback));
  }
};

export default function loadGoogleAPI(callback: () => void) {
  if (!gapi && !loading) {
    loading = true;
    const lib = document.createElement('script');
    lib.src = 'https://apis.google.com/js/api.js';
    document.head.appendChild(lib);
  }
  waitForScript(callback);
}
