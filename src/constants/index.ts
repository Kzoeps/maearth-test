const baseUrl = "https://109468d7e0f7.ngrok-free.app";
export const METADATA = {
  client_id: `${baseUrl}/client-metadata.json`,
  client_name: "GainForest",
  client_uri: baseUrl,
  redirect_uris: [`http://127.0.0.1`] as [string, ...string[]],
  scope: "atproto transition:generic",
  grant_types: ["authorization_code", "refresh_token"] as [
    "authorization_code",
    "refresh_token"
  ],
  response_types: ["code"] as ["code"],
  token_endpoint_auth_method: "none" as const,
  application_type: "web" as const,
  dpop_bound_access_tokens: true,
};
