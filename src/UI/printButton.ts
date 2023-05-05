import Helper from '../Helper';

export default function printButton() {
  Helper.loadGoogleAPI(() => {
    gapi.client
      .request({
        path: `https://www.googleapis.com/drive/v3/files/FILE_ID/export?mimeType=application/pdf`
      })
      .then(console.log);
  });
}
