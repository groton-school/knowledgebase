import File from '@groton/knowledgebase.index/src/File'

export type Result = File & {
  name: string;
  href: string;
  description?: string;
  score: number;
};

export const path = '/_/search';
