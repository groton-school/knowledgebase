import ACL from '../Services/ACL';
import { Var } from '../var';
import HandlerFactory from './HandlerFactory';

type Result = Var.Index[0] & { score: number };

function score(needle: string, haystack: string, base = 1, factor = 2) {
  const pattern = new RegExp(`^(.*\W)?${needle}(\W.*)?$`);
  if (pattern.test(haystack)) {
    return base * factor;
  } else if (haystack.includes(needle)) {
    return base;
  }
  return 0;
}

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
    const query = (req.query.q as string).toLowerCase();
    const minScore = parseInt((req.query.score as string) || '0');
    const results: Result[] = [];
    const available = index.filter((file) => {
      if (config.kb.search) {
        if (config.kb.search.exclude) {
          for (const e of config.kb.search.exclude) {
            if (file.index.path.startsWith(e)) {
              return false;
            }
          }
        }
        if (config.kb.search.include) {
          for (const i of config.kb.search.include) {
            if (!file.index.path.includes(i)) {
              return false;
            }
          }
        }
      }
      return acl.hasAccess(file.permissions);
    });
    available.forEach((file) => {
      const result = { ...file, score: 0 } as Result;
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
    res.send(
      results
        .sort((a, b) => b.score - a.score)
        .map((file) => ({
          name: file.name,
          href: `/${file.index.path}/`,
          description: file.description,
          score: file.score
        }))
    );
  };
};

export default Search;
