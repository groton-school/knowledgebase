import { URLString } from '@battis/descriptive-types';

export type Keys = {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: URLString;
    token_uri: URLString;
    auth_provider_x509_cert_url: URLString;
    client_secret: string;
    redirect_uris: URLString[];
    javascript_origins: URLString[];
  };
};
