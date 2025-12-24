import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextRequest } from "next/server";
import { rateLimiters } from '@/lib/rate-limit';
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
                const adminUser = process.env.ADMIN_USERNAME;
                const adminPass = process.env.ADMIN_PASSWORD;

                if (
                    credentials?.username === adminUser &&
                    credentials?.password === adminPass
                ) {
                    logger.info('Successful admin login', {
                        username: credentials?.username
                    });
                    return { id: "1", name: "Admin", email: "admin@ceritakita.com" };
                }
                
                logger.warn('Failed login attempt', {
                    username: credentials?.username,
                    ip: 'unknown' // Would need to pass request context
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
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account, profile }) {
            // Log successful sign-ins
            logger.info('User signed in', {
                userId: user.id,
                name: user.name
            });
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.userId && session.user) {
                (session.user as any).id = token.userId;
            }
            return session;
        }
    }
};

// Wrap the handler with rate limiting
const originalHandler = NextAuth(authOptions);

export async function GET(req: NextRequest) {
    // Apply rate limiting to auth endpoints
    const rateLimitResult = rateLimiters.strict(req);
    if (rateLimitResult) {
        logger.warn('Rate limit exceeded for auth endpoint', {
            ip: req.headers.get('x-forwarded-for')
        });
        return rateLimitResult;
    }
    
    return originalHandler(req);
}

export async function POST(req: NextRequest) {
    // Apply rate limiting to auth endpoints
    const rateLimitResult = rateLimiters.strict(req);
    if (rateLimitResult) {
        logger.warn('Rate limit exceeded for auth endpoint', {
            ip: req.headers.get('x-forwarded-for')
        });
        return rateLimitResult;
    }
    
    return originalHandler(req);
}
