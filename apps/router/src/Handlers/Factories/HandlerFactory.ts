import Var from '@groton/knowledgebase.config';
import { Handler } from 'express';

type HandlerFactoryConfig = {
  index?: Var.Index;
  config?: Var.Config;
  groups?: Var.Groups;
  keys?: Var.Keys;
};

type HandlerFactory = (config?: HandlerFactoryConfig) => Handler;

export default HandlerFactory;
