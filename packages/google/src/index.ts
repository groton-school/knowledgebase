import ClientClass from './Client';
import MimeTypesConst from './MimeTypes';
import * as StorageModule from '@google-cloud/storage';
import * as DriveModule from '@googleapis/drive';

class Google {
  public static MimeTypes = MimeTypesConst;
}

namespace Google {
  export class Client extends ClientClass {}
  export import Drive = DriveModule;
  export import Storage = StorageModule.Storage;
}

export default Google;
