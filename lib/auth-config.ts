/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { logger } from '@/lib/logger';

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "CeritaKita Admin",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "admin" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                // Import server-side function dynamically to avoid server-only imports in this config
                const { verifyUserCredentials } = await import('@/lib/auth-server');
                const user = verifyUserCredentials(credentials.username, credentials.password);

                if (user) {
                    if (user.is_active === 0) {
                        logger.warn('Login attempt to inactive account', {
                            username: credentials.username
                        });
                        return null;
                    }

                    logger.info('Successful login', {
                        username: user.username,
                        role: user.role
                    });

                    return {
                        id: user.id,
                        name: user.username,
                        email: `${user.username}@ceritakita.local`,
                        role: user.role,
                        permissions: user.permissions
                    };
                }

                logger.warn('Failed login attempt', {
                    username: credentials.username,
                    ip: 'unknown'
                });
                return null;
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user }) {
            // Log successful sign-ins
            logger.info('User signed in', {
                userId: user.id,
                name: user.name,
                role: (user as any).role
            });
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.id;
                token.role = (user as any).role;
                token.permissions = (user as any).permissions;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.userId;
                (session.user as any).role = token.role;
                (session.user as any).permissions = token.permissions;
            }
            return session;
        }
    }
};
