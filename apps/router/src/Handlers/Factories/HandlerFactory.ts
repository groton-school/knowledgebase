import { Config, Groups, Index, Keys } from '@groton/knowledgebase.config';
import { Handler } from 'express';

type HandlerFactoryConfig = {
  index?: Index;
  config?: Config.Config;
  groups?: Groups;
  keys?: Keys;
};

export type HandlerFactory = (config?: HandlerFactoryConfig) => Handler;
