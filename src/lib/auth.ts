import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  auth0Id: string;
  email: string;
  name?: string;
}

/**
 * Extract user information from Authorization header
 * Supports both Bearer tokens and basic auth for development
 */
export async function getUserFromRequest(request: Request): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('authorization');
  const userIdHeader = request.headers.get('x-user-id');
  const userEmailHeader = request.headers.get('x-user-email');

  if (!authHeader && !userIdHeader) {
    return null;
  }

  // Handle Bearer token (simplified - no JWT decoding)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // If we have user email from header, use it to create consistent user ID
    if (userEmailHeader) {
      const emailHash = userEmailHeader.replace(/[^a-zA-Z0-9]/g, '_');
      const userId = `user_${emailHash}`;
      return {
        auth0Id: userId,
        email: userEmailHeader,
        name: userEmailHeader.split('@')[0]
      };
    }
    
    // Final fallback: use a consistent hash of the token
    const tokenHash = token.slice(-12);
    const userId = `auth0_user_${tokenHash}`;
    
    return {
      auth0Id: userId,
      email: `${userId}@auth0.local`,
      name: `Auth0 User ${tokenHash}`
    };
  }

  // Handle development mode with user ID in header
  if (userIdHeader) {
    return {
      auth0Id: userIdHeader,
      email: `${userIdHeader}@dev.local`,
      name: `Dev User ${userIdHeader}`
    };
  }

  return null;
}

/**
 * Generate a safe database name from user's Auth0 ID
 * Removes special characters and ensures valid MongoDB database name
 */
export function getUserDatabaseName(auth0Id: string): string {
  // Remove auth0| prefix if present and sanitize
  const cleanId = auth0Id.replace(/^auth0\|/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `marketlens_user_${cleanId}`;
}

/**
 * Middleware-like function to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<{ user: AuthenticatedUser } | { error: Response }> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }

  return { user };
}
