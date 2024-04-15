type GoogleOAuthCredentials = {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    client_secret: string;
    redirect_uris?: string[];
  };
};
export default GoogleOAuthCredentials;
