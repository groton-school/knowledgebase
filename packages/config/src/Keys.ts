import { UrlString } from '@groton/knowledgebase.domain';

type Keys = {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: UrlString;
    token_uri: UrlString;
    auth_provider_x509_cert_url: UrlString;
    client_secret: string;
    redirect_uris: UrlString[];
    javascript_origins: UrlString[];
  };
};

export default Keys;
