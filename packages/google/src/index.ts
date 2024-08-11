import _Client from './Client';
import _MimeTypes from './MimeTypes';
import * as _Storage from '@google-cloud/storage';
import * as _Drive from '@googleapis/drive';

class Google {
  public static MimeTypes = _MimeTypes;
}

namespace Google {
  export class Client extends _Client {}
  export import Drive = _Drive;
  export import Storage = _Storage.Storage;
}

export default Google;
