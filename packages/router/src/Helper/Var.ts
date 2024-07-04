import File from '@groton/knowledgebase.indexer/src/File';
import Folder from '@groton/knowledgebase.indexer/src/Folder';

type URLString = string;
type EmailString = string;

export namespace Var {
  export type Config = {
    gae: { url: string };
    session: { secret: string };
    storage: { bucket: string };
  };

  // TODO surely this must be defined _somewhere_ in google-auth-library
  export type Keys = {
    web: {
      client_id: string;
      project_id: string;
      auth_uri: URLString;
      token_uri: URLString;
      auth_provider_x509_cert_url: string;
      client_secret: string;
      redirect_uris: URLString[];
      javascript_origins: URLString[];
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
