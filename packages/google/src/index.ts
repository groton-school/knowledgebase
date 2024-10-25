import * as _Storage from '@google-cloud/storage';
import * as _Drive from '@googleapis/drive';
import _Client from './Client.js';
import _MimeTypes from './MimeTypes.js';

class Google {
  public static MimeTypes = _MimeTypes;
}

namespace Google {
  export class Client extends _Client {}
  export import Drive = _Drive;
  export import Storage = _Storage.Storage;
}

export default Google;
