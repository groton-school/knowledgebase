import ACL from '../Services/ACL';
import HandlerFactory from './HandlerFactory';

const Search: HandlerFactory = ({ index, groups, config } = {}) => {
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

  return async (req, res) => {
    const acl = await new ACL(req, groups).prepare();
    res.send(
      index
        .filter(
          (file) =>
            (file.name.toLowerCase().includes(req.query.q.toLowerCase()) ||
              file.description
                ?.toLowerCase()
                .includes(req.query.q.toLowerCase()) ||
              file.index.path
                .toLowerCase()
                .includes(req.query.q.toLowerCase())) &&
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

export default Search;
