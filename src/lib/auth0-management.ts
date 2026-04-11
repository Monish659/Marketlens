import { ManagementClient } from 'auth0';

// Auth0 Management API client for creating users
let managementClient: ManagementClient | null = null;

export function getManagementClient(): ManagementClient {
  if (!managementClient) {
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_M2M_CLIENT_ID;
    const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET;

    if (!domain || !clientId || !clientSecret) {
      throw new Error('Missing Auth0 Management API credentials. Please set AUTH0_DOMAIN, AUTH0_M2M_CLIENT_ID, and AUTH0_M2M_CLIENT_SECRET in your environment variables.');
    }

    managementClient = new ManagementClient({
      domain,
      clientId,
      clientSecret
    });
  }

  return managementClient;
}

export interface Auth0UserProfile {
  email: string;
  name: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
  email_verified?: boolean;
  blocked?: boolean;
  connection?: string;
}

export async function createAuth0User(profile: Auth0UserProfile): Promise<any> {
  console.log('🔐 [AUTH0] Creating user:', profile.email);
  
  try {
    const client = getManagementClient();
    
    // Create user in Auth0
    const user = await client.users.create({
      email: profile.email,
      name: profile.name,
      connection: profile.connection || 'Username-Password-Authentication', // Default connection
      email_verified: profile.email_verified || false, // Don't require email verification for fake profiles
      blocked: profile.blocked || false,
      user_metadata: profile.user_metadata,
      app_metadata: profile.app_metadata,
      // Generate a random password for fake users (they won't use it anyway)
      password: generateRandomPassword()
    });

    console.log('✅ [AUTH0] User created successfully:', user.data.user_id);
    return user.data;

  } catch (error: any) {
    console.error('💥 [AUTH0] Error creating user:', error);
    
    // Handle specific Auth0 errors
    if (error.statusCode === 409) {
      console.log('⚠️ [AUTH0] User already exists:', profile.email);
      // User already exists, try to get existing user
      try {
        const client = getManagementClient();
        const existingUsers = await client.users.getAll({
          q: `email:"${profile.email}"`,
          search_engine: 'v3'
        });
        if (existingUsers.data && existingUsers.data.length > 0) {
          console.log('📋 [AUTH0] Retrieved existing user:', existingUsers.data[0].user_id);
          return existingUsers.data[0];
        }
      } catch (getError) {
        console.error('💥 [AUTH0] Error retrieving existing user:', getError);
      }
    } else if (error.statusCode === 429) {
      console.error('🚫 [AUTH0] Rate limit exceeded! Waiting 2 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Retry once after rate limit
      try {
        const retryClient = getManagementClient();
        const retryUser = await retryClient.users.create({
          email: profile.email,
          name: profile.name,
          connection: profile.connection || 'Username-Password-Authentication',
          email_verified: profile.email_verified || false,
          blocked: profile.blocked || false,
          user_metadata: profile.user_metadata,
          app_metadata: profile.app_metadata,
          password: generateRandomPassword()
        });
        console.log('✅ [AUTH0] User created successfully after retry:', retryUser.data.user_id);
        return retryUser.data;
      } catch (retryError) {
        console.error('💥 [AUTH0] Retry failed:', retryError);
        throw retryError;
      }
    }
    
    throw error;
  }
}

export async function createBulkAuth0Users(profiles: Auth0UserProfile[]): Promise<{ success: any[], failed: any[] }> {
  console.log('🔐 [AUTH0] Creating bulk users:', profiles.length);
  console.log('🔐 [AUTH0] Rate limit: 2 requests/second with bursts up to 10');
  
  const success: any[] = [];
  const failed: any[] = [];
  
  // Process sequentially to respect 2 requests/second rate limit
  // With 500ms delay between requests = 2 requests/second
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    console.log(`🔐 [AUTH0] Processing user ${i + 1}/${profiles.length}: ${profile.email}`);
    
    try {
      const user = await createAuth0User(profile);
      success.push({ profile: profile.email, user: user?.user_id || 'unknown' });
      console.log(`✅ [AUTH0] Created user ${i + 1}/${profiles.length}: ${profile.email}`);
    } catch (error) {
      console.error(`💥 [AUTH0] Failed to create user ${profile.email}:`, error);
      failed.push({ profile: profile.email, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    // Wait 500ms between requests to stay under 2 requests/second
    // Only wait if there are more users to process
    if (i < profiles.length - 1) {
      console.log('⏱️ [AUTH0] Waiting 500ms to respect rate limit...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`✅ [AUTH0] Bulk creation complete - Success: ${success.length}, Failed: ${failed.length}`);
  return { success, failed };
}

function generateRandomPassword(): string {
  // Generate a secure random password for fake users
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function deleteAuth0User(userId: string): Promise<void> {
  console.log('🗑️ [AUTH0] Deleting user:', userId);
  
  try {
    const client = getManagementClient();
    await client.users.delete({ id: userId });
    console.log('✅ [AUTH0] User deleted successfully:', userId);
  } catch (error) {
    console.error('💥 [AUTH0] Error deleting user:', error);
    throw error;
  }
}

export async function getFakeUsers(): Promise<any[]> {
  console.log('🔍 [AUTH0] Retrieving fake users...');
  
  try {
    const client = getManagementClient();
    
    // Search for users with fake profile metadata
    const users = await client.users.getAll({
      q: 'app_metadata.is_fake_profile:true',
      search_engine: 'v3'
    });
    
    console.log(`📋 [AUTH0] Found ${users.data?.length || 0} fake users`);
    return users.data || [];
    
  } catch (error) {
    console.error('💥 [AUTH0] Error retrieving fake users:', error);
    throw error;
  }
}
