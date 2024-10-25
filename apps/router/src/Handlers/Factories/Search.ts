import * as API from '@groton/knowledgebase.api';
import { Request, Response } from 'express';
import { ACL } from '../../Services.js';
import { HandlerFactory } from './HandlerFactory.js';

function score(needle: string, haystack: string, base = 1, factor = 2) {
  const pattern = new RegExp(`^(.*\W)?${needle}(\W.*)?$`);
  if (pattern.test(haystack)) {
    return base * factor;
  } else if (haystack.includes(needle)) {
    return base;
  }
  return 0;
}

export const Search: HandlerFactory = ({ index, groups, config } = {}) => {
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

  return async (req: Request, res: Response) => {
    const acl = await new ACL(req, res, groups).prepare();
    const query = (req.query.q as string).toLowerCase();
    const minScore = parseInt((req.query.score as string) || '0');
    let results: API.Search.Result[] = [];
    const available = index.filter((file) => {
      if (file.index.hidden) {
        return false;
      }
      if (config.ui?.search) {
        if (config.ui.search.include) {
          for (const i of config.ui.search.include) {
            if (!file.index.path.includes(i)) {
              return false;
            }
          }
        }
        if (config.ui.search.exclude) {
          for (const e of config.ui.search.exclude) {
            if (file.index.path.startsWith(e)) {
              return false;
            }
          }
        }
      }
      return acl.hasAccess(file.permissions);
    });
    available.forEach((file) => {
      const result = { ...file, score: 0 } as API.Search.Result;
      result.score += score(query, file.name.toLowerCase(), 10);
      result.score += score(query, file.description?.toLowerCase() || '', 8);
      query.split(' ').forEach((part) => {
        result.score += score(part, file.name.toLowerCase(), 5);
        result.score += score(part, file.description?.toLowerCase() || '', 3);
        result.score += score(part, file.index.path, 1);
      });
      if (result.score > minScore) {
        results.push(result);
      }
    });

    results = results.reduce((unique, result) => {
      const i = unique.findIndex(
        (u) => u.name == result.name && u.description == result.description
      );
      if (i >= 0) {
        unique[i].score += result.score;
      } else {
        unique.push(result);
      }
      return unique;
    }, [] as API.Search.Result[]);

    res.send(`<!doctype html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta content="text/html; charset=UTF-8" http-equiv="content-type">
              <title>Search: ${query}</title>${
                config.ui?.site?.favicon
                  ? `
              <link rel="icon" href="${config.ui.site.favicon}">`
                  : ''
              }${
                config.ui?.site?.css
                  ? `
              <link rel="stylesheet" href="${config.ui.site.css}" />`
                  : ''
              }
            </head>
            <body>
            <div id="directory">
            <h1 class="title">Search: ${query}</h1>
            ${results
              .sort((a, b) => b.score - a.score)
              .map(
                (page) =>
                  `<div class="page${
                    page.mimeType == 'application/vnd.google-apps.folder'
                      ? ' directory'
                      : ''
                  }">
                    <div class="name"><a href="/${page.index.path}/">${
                      page.name
                    }</a></div>${
                      page.description
                        ? `<div class="description">${page.description}</div>`
                        : ''
                    }</div>`
              )
              .join('')}
            </div>${
              config.ui?.site?.js
                ? `
              <script src="${config.ui.site.js}"></script>`
                : ''
            }
            </body>
            <html>
            `);
  };
};
