export const oauthProviderIds = [
  "github",
  "google",
  "microsoft-entra-id",
] as const;

export type OAuthProviderId = (typeof oauthProviderIds)[number];

const providerEnvironmentVariables: Record<
  OAuthProviderId,
  { clientId: string; clientSecret: string }
> = {
  github: {
    clientId: "AUTH_GITHUB_ID",
    clientSecret: "AUTH_GITHUB_SECRET",
  },
  google: {
    clientId: "AUTH_GOOGLE_ID",
    clientSecret: "AUTH_GOOGLE_SECRET",
  },
  "microsoft-entra-id": {
    clientId: "AUTH_MICROSOFT_ENTRA_ID_ID",
    clientSecret: "AUTH_MICROSOFT_ENTRA_ID_SECRET",
  },
};

export function getOAuthProviderCredentials(provider: OAuthProviderId) {
  const { clientId: clientIdVariable, clientSecret: clientSecretVariable } =
    providerEnvironmentVariables[provider];
  const clientId = process.env[clientIdVariable];
  const clientSecret = process.env[clientSecretVariable];

  if (!clientId && !clientSecret) return null;
  if (!clientId || !clientSecret) {
    console.warn(
      `${provider} sign-in is disabled; configure both ${clientIdVariable} and ${clientSecretVariable}.`,
    );
    return null;
  }

  return { clientId, clientSecret };
}

export function getConfiguredOAuthProviders() {
  return oauthProviderIds.filter((provider) =>
    getOAuthProviderCredentials(provider),
  );
}
