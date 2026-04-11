import { NextRequest, NextResponse } from 'next/server';
import { getManagementClient } from '@/lib/auth0-management';
import { supabaseAdmin } from '@/lib/supabase';

function hashToPositiveInt(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function inferProfileFromRecord(record: any, index = 0) {
  const email: string = record.email || '';
  const fallbackName = email ? email.split('@')[0] : `user_${index + 1}`;
  const fullName =
    record.name ||
    record.user_metadata?.name ||
    record.raw_user_meta_data?.name ||
    fallbackName;
  const country = record.user_metadata?.country || 'United States';
  const city = record.user_metadata?.city || 'San Francisco';

  const lat = typeof record.user_metadata?.latitude === 'number'
    ? record.user_metadata.latitude
    : 37.7749 + ((index % 20) - 10) * 0.1;
  const lon = typeof record.user_metadata?.longitude === 'number'
    ? record.user_metadata.longitude
    : -122.4194 + ((index % 20) - 10) * 0.1;

  return {
    personaId: record.user_metadata?.personaId || hashToPositiveInt(record.user_id || record.id || `${email}-${index}`),
    name: fullName,
    title:
      record.user_metadata?.title ||
      record.user_metadata?.occupation ||
      record.raw_user_meta_data?.title ||
      record.raw_user_meta_data?.occupation ||
      'Professional',
    email,
    location: record.user_metadata?.location || {
      city,
      country,
      coordinates: {
        type: 'Point',
        coordinates: [lon, lat]
      }
    },
    demographics: record.user_metadata?.demographics || {
      generation: record.user_metadata?.generation || 'Millennial',
      gender: record.user_metadata?.gender || 'Not specified',
      ageRange: record.user_metadata?.age ? `${record.user_metadata.age}-${record.user_metadata.age + 5}` : '25-35'
    },
    professional: record.user_metadata?.professional || {
      seniority: record.user_metadata?.seniority || 'Mid-level',
      primaryIndustry: record.user_metadata?.industry || 'Technology',
      secondaryIndustry: record.user_metadata?.secondary_industry || 'Business',
      companySize: record.user_metadata?.company_size || '50-200',
      yearsExperience: record.user_metadata?.years_experience || 5
    },
    psychographics: record.user_metadata?.psychographics || {
      techAdoption: 5,
      riskTolerance: 5,
      priceSensitivity: 5,
      influenceScore: 5,
      brandLoyalty: 5
    },
    interests: record.user_metadata?.interests || ['Technology', 'Business', 'Innovation'],
    personality: record.user_metadata?.personality || {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5
    },
    user_id: record.user_id || record.id || `user_${index + 1}`,
    country,
    age: record.user_metadata?.age || 30,
    occupation: record.user_metadata?.occupation || record.user_metadata?.title || 'Professional',
    lifestyle: record.user_metadata?.lifestyle || ['Tech-savvy', 'Professional'],
    likes_about_niche: record.user_metadata?.niche_likes || 'Innovation and efficiency',
    dislikes_about_niche: record.user_metadata?.niche_dislikes || 'Complexity and high costs',
    use_cases: record.user_metadata?.use_cases || ['Professional development', 'Productivity'],
    purchase_intent: record.user_metadata?.purchase_intent || 'Moderate',
    user_type: record.user_metadata?.user_type || 'Early adopter',
    createdAt: new Date(record.created_at || Date.now()),
    updatedAt: new Date(record.updated_at || Date.now())
  };
}

async function fetchSupabaseUsers(limit: number) {
  console.log('🟢 [FETCH-LIVE-USERS] Falling back to Supabase users table');

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Supabase users fetch failed: ${error.message}`);
  }

  const rows = data || [];
  const users = rows.map((row: any, index: number) =>
    inferProfileFromRecord(
      {
        id: row.id,
        user_id: row.id,
        email: row.email,
        name: row.name,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user_metadata: {}
      },
      index
    )
  );

  return {
    users,
    total: rows.length,
    source: 'supabase'
  };
}

export async function GET(request: NextRequest) {
  console.log('👥 [FETCH-AUTH0-USERS] API endpoint called');
  
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    console.log('🔍 [FETCH-AUTH0-USERS] Fetching users:', { niche, limit });
    
    try {
      const client = getManagementClient();
      
      // Build search query if niche is provided
      const searchQuery = niche ? `app_metadata.niche:"${niche}"` : undefined;
      
      // Fetch users from Auth0 (handle pagination for large requests)
      let allUsers: any[] = [];
      let totalCount = 0;
      const perPage = 100; // Auth0 max per page
      const maxPages = Math.ceil(Math.min(limit, 1000) / perPage); // Cap at 1000 users max
      
      console.log(`🔄 [FETCH-AUTH0-USERS] Need to fetch ${limit} users, will make ${maxPages} requests of ${perPage} each`);
      
      for (let page = 0; page < maxPages; page++) {
        console.log(`📄 [FETCH-AUTH0-USERS] Fetching page ${page + 1}/${maxPages}`);
        
        const response = await client.users.getAll({
          q: searchQuery,
          search_engine: searchQuery ? 'v3' : undefined,
          per_page: perPage,
          page: page,
          include_totals: true
        });
        
        // Normalize Auth0 response shape
        const rawData: any = (response as any)?.data ?? response;
        const pageUsers: any[] = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.users) ? rawData.users : []);
        
        if (page === 0) {
          totalCount = typeof rawData?.total === 'number' ? rawData.total : pageUsers.length;
        }
        
        allUsers = [...allUsers, ...pageUsers];
        
        console.log(`📄 [FETCH-AUTH0-USERS] Page ${page + 1}: got ${pageUsers.length} users, total so far: ${allUsers.length}`);
        
        // Stop if we got fewer users than requested (reached end)
        if (pageUsers.length < perPage) {
          console.log(`🏁 [FETCH-AUTH0-USERS] Reached end of users at page ${page + 1}`);
          break;
        }
        
        // Stop if we have enough users
        if (allUsers.length >= limit) {
          console.log(`🎯 [FETCH-AUTH0-USERS] Reached target of ${limit} users`);
          break;
        }
      }
      
      const usersArray = allUsers.slice(0, limit); // Trim to exact limit
      console.log(`✅ [FETCH-AUTH0-USERS] Found ${usersArray.length} users (total available=${totalCount})`);

      const profiles = usersArray.map((user: any, index: number) => inferProfileFromRecord(user, index));

      if (profiles.length === 0) {
        throw new Error('No Auth0 users returned');
      }
      
      return NextResponse.json({ 
        success: true, 
        users: profiles,
        total: totalCount,
        niche: niche || 'all',
        limit: limit,
        source: 'auth0'
      });
    } catch (auth0Error) {
      console.warn('⚠️ [FETCH-AUTH0-USERS] Auth0 unavailable, using Supabase fallback:', auth0Error);
      const fallback = await fetchSupabaseUsers(limit);

      return NextResponse.json({
        success: true,
        users: fallback.users,
        total: fallback.total,
        niche: niche || 'all',
        limit,
        source: fallback.source
      });
    }

  } catch (error) {
    console.error('💥 [FETCH-AUTH0-USERS] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Auth0 users',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      users: [],
      total: 0
    }, { status: 500 });
  }
}
