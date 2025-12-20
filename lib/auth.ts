import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

/**
 * Get the NextAuth configuration
 * We need to import this dynamically to avoid circular dependencies
 */
async function getAuthOptions() {
  // Import the auth handler from the route
  const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
  return authOptions;
}

/**
 * Check if the request is authenticated
 * Returns the session if authenticated, null otherwise
 */
export async function getSession() {
  const authOptions = await getAuthOptions();
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Middleware to require authentication for API routes
 * Usage in API routes:
 *
 * export async function GET(req: NextRequest) {
 *   const authCheck = await requireAuth(req);
 *   if (authCheck) return authCheck; // Returns 401 response
 *
 *   // Your authenticated logic here
 * }
 */
export async function requireAuth(_req: NextRequest): Promise<NextResponse | null> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  return null; // No error, user is authenticated
}
