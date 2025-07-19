import ACLType from './Config/ACL.js';
import { Config as ConfigType } from './Config/Config.js';
import SessionType from './Config/Session.js';
import StorageType from './Config/Storage.js';
import UIType from './Config/UI.js';
import createDefaultFunc from './Config/createDefault.js';
export * as Sync from './Config/Sync.js';

export interface Config extends ConfigType {}

export namespace Config {
  export const createDefault = createDefaultFunc;
  export type Session = SessionType;
  export type Storage = StorageType;
  export type ACL = ACLType;
  export type UI = UIType;
}
