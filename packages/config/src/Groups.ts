import { EmailString } from '@groton/knowledgebase.domain';

export type Group = {
  displayName: string;
  groupKey: { id: EmailString };
  name: string; // groups/*
  members?: EmailString[];
};

type Groups = Record<EmailString, Group>;

export default Groups;
