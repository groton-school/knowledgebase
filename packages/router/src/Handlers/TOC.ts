import ACL from '../Services/ACL';
import HandlerFactory from './HandlerFactory';

const TOC: HandlerFactory = ({ index, groups, config } = {}) => {
  // TODO better way to do this?
  if (!config || !index || !groups) {
    throw new Error(
      `Missing TOC configuration: ${JSON.stringify({
        config: !!config,
        index: !!index,
        groups: !!groups
      })}`
    );
  }

  const root = index.find((file) => file.index.path == config.kb.root);

  return async (req, res) => {
    const acl = await new ACL(req, groups).prepare();
    res.send(
      index
        .filter(
          (file) =>
            file.mimeType == 'application/vnd.google-apps.folder' &&
            file.parents?.includes(root!.id) &&
            acl.hasAccess(file.permissions)
        )
        .map((file) => ({
          name: file.name,
          href: `/${file.index.path}/`,
          description: file.description
        }))
    );
  };
};

export default TOC;
