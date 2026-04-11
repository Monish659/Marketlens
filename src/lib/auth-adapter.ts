// Auth adapter that translates Auth0 frontend to Supabase backend
import { supabase } from './supabase'

type JwtPayload = {
  sub?: string
  email?: string
  user_id?: string
  [key: string]: unknown
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const payload = parts[1]
    const json = Buffer.from(payload, 'base64url').toString('utf8')
    return JSON.parse(json) as JwtPayload
  } catch (error) {
    console.error('Failed to parse JWT payload:', error)
    return null
  }
}

export async function getUserFromToken(authTokens: any) {
  // Extract user info from Auth0 tokens but use Supabase for data storage
  const userEmail = authTokens.email || authTokens.user?.email
  const userName = authTokens.name || authTokens.user?.name
  const auth0UserId = authTokens.sub || authTokens.user_id
  
  if (!userEmail) {
    throw new Error('No email found in auth tokens')
  }
  
  // Find or create user in Supabase
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', userEmail)
    .single()
  
  if (error && error.code === 'PGRST116') {
    // User doesn't exist, create them
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: userEmail,
        name: userName || userEmail.split('@')[0],
        // Store original Auth0 ID for reference if available
      })
      .select()
      .single()
    
    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`)
    }
    
    user = newUser
  } else if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
  
  return user
}

export function extractUserFromHeaders(request: Request) {
  // Extract user info from headers (handle both old and new formats)
  let userEmail = request.headers.get('x-user-email')
  let userId = request.headers.get('x-user-id')
  const authorization = request.headers.get('authorization')
  
  // For backward compatibility, try to extract from localStorage-style auth
  // The frontend passes user data via different headers depending on the component
  const authTokens = authorization?.replace('Bearer ', '')

  // Fallback: extract identity directly from bearer JWT token.
  // This makes OAuth flows resilient even if x-user-email is missing.
  if ((!userEmail || !userId) && authTokens) {
    const jwtPayload = parseJwtPayload(authTokens)
    if (jwtPayload) {
      userEmail = userEmail || (typeof jwtPayload.email === 'string' ? jwtPayload.email : null)
      userId = userId || (typeof jwtPayload.sub === 'string'
        ? jwtPayload.sub
        : (typeof jwtPayload.user_id === 'string' ? jwtPayload.user_id : null))
    }
  }
  
  return {
    email: userEmail,
    id: userId,
    authorization,
    authTokens
  }
}

export async function getUserFromRequest(request: Request) {
  const tokens = localStorage?.getItem?.('auth_tokens')
  const userData = localStorage?.getItem?.('user_data')
  
  if (tokens && userData) {
    try {
      const parsedTokens = JSON.parse(tokens)
      const parsedUser = JSON.parse(userData)
      
      return {
        email: parsedUser.email,
        name: parsedUser.name,
        sub: parsedUser.sub
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
  }
  
  return null
}
