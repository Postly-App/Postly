/**
 * Configuration OAuth2 par réseau (URLs officielles + scopes minimums demandés).
 * Les identifiants clients lus depuis les variables d’environnement (jamais côté client).
 */
export const OAUTH_SLUGS = [
  "facebook",
  "instagram",
  "youtube",
  "linkedin",
  "twitter",
  "threads",
  "pinterest",
  "tiktok",
] as const

export type OauthSlug = (typeof OAUTH_SLUGS)[number]

export function isOauthSlug(raw: string): raw is OauthSlug {
  return (OAUTH_SLUGS as readonly string[]).includes(raw)
}

export type OauthProviderConfig = {
  /** Identifiant stocké en SocialAccount.platform (canonique). */
  platformId:
    | "FACEBOOK"
    | "INSTAGRAM"
    | "YOUTUBE"
    | "LINKEDIN"
    | "TWITTER"
    | "THREADS"
    | "PINTEREST"
    | "TIKTOK"
  clientIdEnv: string
  clientSecretEnv: string
  authorizeUrl: (p: {
    clientId: string
    redirectUri: string
    state: string
    scope: string
    codeChallenge?: string
  }) => string
  scope: string
  usesPkce: boolean
}

const FB_SCOPES =
  "pages_show_list,pages_read_engagement,pages_manage_posts,business_management"
const IG_SCOPES =
  "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement"

export const OAUTH_CONFIG: Record<OauthSlug, OauthProviderConfig> = {
  facebook: {
    platformId: "FACEBOOK",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
    scope: FB_SCOPES,
    usesPkce: false,
    authorizeUrl: ({ clientId, redirectUri, state, scope }) =>
      `https://www.facebook.com/v18.0/dialog/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&response_type=code&scope=${encodeURIComponent(scope)}`,
  },
  instagram: {
    platformId: "INSTAGRAM",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
    scope: IG_SCOPES,
    usesPkce: false,
    authorizeUrl: ({ clientId, redirectUri, state, scope }) =>
      `https://www.facebook.com/v18.0/dialog/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&response_type=code&scope=${encodeURIComponent(scope)}`,
  },
  youtube: {
    platformId: "YOUTUBE",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    scope: encodeURIComponent(
      "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"
    ),
    usesPkce: false,
    authorizeUrl: ({ clientId, redirectUri, state, scope }) =>
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}&scope=${scope}`,
  },
  linkedin: {
    platformId: "LINKEDIN",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    scope: encodeURIComponent("openid profile email w_member_social"),
    usesPkce: false,
    authorizeUrl: ({ clientId, redirectUri, state, scope }) =>
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${scope}`,
  },
  twitter: {
    platformId: "TWITTER",
    clientIdEnv: "TWITTER_CLIENT_ID",
    clientSecretEnv: "TWITTER_CLIENT_SECRET",
    scope: encodeURIComponent("tweet.read tweet.write users.read offline.access"),
    usesPkce: true,
    authorizeUrl: ({ clientId, redirectUri, state, scope, codeChallenge }) =>
      `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${scope}&code_challenge_method=S256&code_challenge=${encodeURIComponent(codeChallenge ?? "")}`,
  },
  threads: {
    platformId: "THREADS",
    clientIdEnv: "THREADS_CLIENT_ID",
    clientSecretEnv: "THREADS_CLIENT_SECRET",
    scope: encodeURIComponent("threads_basic threads_content_publish"),
    usesPkce: false,
    authorizeUrl: ({ clientId, redirectUri, state, scope }) =>
      `https://www.threads.net/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${encodeURIComponent(state)}`,
  },
  pinterest: {
    platformId: "PINTEREST",
    clientIdEnv: "PINTEREST_CLIENT_ID",
    clientSecretEnv: "PINTEREST_CLIENT_SECRET",
    scope: encodeURIComponent("boards:read,pins:write"),
    usesPkce: false,
    authorizeUrl: ({ clientId, redirectUri, state, scope }) =>
      `https://www.pinterest.com/oauth/?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${encodeURIComponent(state)}`,
  },
  tiktok: {
    platformId: "TIKTOK",
    clientIdEnv: "TIKTOK_CLIENT_ID",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    scope: encodeURIComponent("user.info.basic,video.upload"),
    usesPkce: false,
    authorizeUrl: ({ clientId, redirectUri, state, scope }) =>
      `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${encodeURIComponent(state)}`,
  },
}
