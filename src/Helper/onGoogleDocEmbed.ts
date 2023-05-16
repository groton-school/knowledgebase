import onSelectorReady from './onSelectorReady';

export default function onGoogleDocEmbed(
  selector: string
): Promise<HTMLElement[]> {
  return new Promise((resolve, reject) => {
    onSelectorReady(
      '.CMSgoogledocembed',
      '.od-iframe-loader, .folder-item'
    ).then(
      (embed) => resolve(Array.from(embed.querySelectorAll(selector))),
      () => reject()
    );
  });
}
