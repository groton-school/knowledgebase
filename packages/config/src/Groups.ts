import { EmailString } from '@groton/knowledgebase.strings';

export type Group = {
  displayName: string;
  groupKey: { id: EmailString };
  name: string; // groups/*
};

type Groups = Group[];

export default Groups;
