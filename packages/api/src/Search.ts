import { Index } from '@groton/knowledgebase.index';

export type Result = Index.File & {
  name: string;
  href: string;
  description?: string;
  score: number;
};

export const path = '/_/search';
