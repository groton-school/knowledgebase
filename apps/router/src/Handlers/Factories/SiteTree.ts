import ACL from '../../Services/ACL';
import HandlerFactory from './HandlerFactory';
import API from '@groton/knowledgebase.api';
import { Request, Response } from 'express';

const SiteTree: HandlerFactory = ({ index, groups, config } = {}) => {
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

  const root = index.find((file) => file.index.path == config.ui?.root || '.');

  return async (req: Request, res: Response) => {
    const acl = await new ACL(req, res, groups).prepare();
    res.send(
      root
        ? (index
            .filter(
              (file) =>
                file.mimeType == 'application/vnd.google-apps.folder' &&
                file.parents?.includes(root.id) &&
                acl.hasAccess(file.permissions)
            )
            .map((file) => ({
              name: file.name,
              href: `/${file.index.path}/`,
              description: file.description
            })) as API.SiteTree.PageList)
        : []
    );
  };
};

export default SiteTree;
