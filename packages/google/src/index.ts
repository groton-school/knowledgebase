import ClientClass from './Client';
import MimeTypesConst from './MimeTypes';

class Google {
  public static MimeTypes = MimeTypesConst;
}

namespace Google {
  export class Client extends ClientClass {}
}

export default Google;
