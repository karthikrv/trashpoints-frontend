import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google, { GoogleProfile } from "next-auth/providers/google";
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!
    }),
    Credentials({
      id: "firebase-consumer",
      name: "Firebase Consumer",
      credentials: {
        token: { label: "Firebase Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        try {
          const response = await fetch(
            `${process.env.TRASHPOINT_BACKEND_URL}users/resolve-consumer`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${credentials.token}`,
              },
            }
          );

          if (!response.ok) return null;

          const data = await response.json();

          if (data.isAuthorised && data.user) {
            return {
              id: data.user.id,
              name: data.user.name,
              role: data.user.role,
            };
          }

          return null;
        } catch (err) {
          console.error("Firebase consumer authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const googleProfile = profile as GoogleProfile
        if ( googleProfile?.email_verified && googleProfile.email?.endsWith("@gmail.com")) {
          return true
        }
        return false
      }
      if (account?.provider === "firebase-consumer") {
        return true
      }
      return false
    },

    async jwt({token, account, user}) {
      if (account?.provider === "google") {
        const requestOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json"},
          body: JSON.stringify({ "token": account?.id_token})
        }
        const response = await fetch(`${process.env.TRASHPOINT_BACKEND_URL}users/resolve`, requestOptions);
        if (response.status != 200) {
          token.isAuthorised = false
          return token
        };
        const data = await response.json();
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId
        token.role = data.data.role
        token.isAuthorised = true
      }

      if (account?.provider === "firebase-consumer" && user) {
        token.provider = "firebase-consumer";
        token.role = (user as any).role;
        token.isAuthorised = true;
      }

      return token
    },

    async session({session, token}) {
      if (session.user) {
        session.provider = token.provider;
        session.providerAccountId = token.providerAccountId
        session.role = token.role
        session.isAuthorised = token.isAuthorised
      }
      return session
    }
  },
})