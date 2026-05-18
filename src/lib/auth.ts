import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import {
  getNextAuthSecret,
  resolveUseSecureCookies,
  validateNextAuthUrlConfig,
} from "@/lib/env/auth"
import { logger } from "./logger"

void validateNextAuthUrlConfig()

/** Durée de session JWT (secondes) — 14 jours */
const SESSION_MAX_AGE_SEC = 14 * 24 * 60 * 60
/** Rafraîchissement session côté client — 24 h */
const SESSION_UPDATE_AGE_SEC = 24 * 60 * 60

const OAUTH_TOKEN_KEYS = [
  "access_token",
  "refresh_token",
  "id_token",
  "oauth_token",
  "oauth_token_secret",
  "session_state",
  "providerAccountId",
] as const

function stripOAuthSecretsFromJwt(token: Record<string, unknown>): void {
  for (const k of OAUTH_TOKEN_KEYS) {
    delete token[k]
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: getNextAuthSecret(),
  useSecureCookies: resolveUseSecureCookies(),
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SEC,
    updateAge: SESSION_UPDATE_AGE_SEC,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SEC,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  logger: {
    error(code, metadata) {
      if (metadata && typeof metadata === "object" && "error" in metadata) {
        const err = (metadata as { error?: Error }).error
        logger.error(`next_auth:${String(code)}`, {
          route: "/api/auth/[...nextauth]",
          provider: "next-auth",
          err,
        })
        return
      }
      logger.error(`next_auth:${String(code)}`, {
        route: "/api/auth/[...nextauth]",
        provider: "next-auth",
      })
    },
    warn(code) {
      logger.warn(`next_auth:${String(code)}`, {
        route: "/api/auth/[...nextauth]",
        provider: "next-auth",
      })
    },
    debug() {
      /* désactivé : évite tout fuite de contexte sensible en logs */
    },
  },
  providers: [
    GoogleProvider({
      // allowDangerousEmailAccountLinking removed: prevents account takeover
      // if an attacker registers with a target's email before they OAuth-login.
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as Record<string, unknown>
      stripOAuthSecretsFromJwt(t)

      if (user) {
        t.id = user.id
        t.sub = user.id
      }

      stripOAuthSecretsFromJwt(t)
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string
      return session
    },
  },
}
