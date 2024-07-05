import File from '@groton/knowledgebase.indexer/src/File';
import Folder from '@groton/knowledgebase.indexer/src/Folder';

declare namespace Var {
  export type Config = {
    gae: { url: UrlString };
    session: { secret: string };
    storage: { bucket: string };
    kb: { root: PathString; tocRoute: PathString; searchRoute: PathString };
  };

  // TODO surely this must be defined _somewhere_ in google-auth-library
  export type Keys = {
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

  type Group = {
    displayName: string;
    groupKey: { id: EmailString };
    name: string; // groups/*
  };
  export type Groups = Group[];

  export type Index = (File | Folder)[];
}
