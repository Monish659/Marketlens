import { NextRequest, NextResponse } from 'next/server';
import { getManagementClient } from '@/lib/auth0-management';

export async function GET(request: NextRequest) {
  console.log('👥 [FETCH-AUTH0-USERS] API endpoint called');
  
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    console.log('🔍 [FETCH-AUTH0-USERS] Fetching users:', { niche, limit });
    
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
    
    // Transform Auth0 users to your profile format
    const profiles = usersArray.map((user: any) => ({
      personaId: user.user_metadata?.personaId || user.user_id,
      name: user.name || user.nickname || user.email?.split('@')[0] || 'Unknown User',
      title: user.user_metadata?.title || user.user_metadata?.occupation || 'Professional',
      email: user.email,
      location: user.user_metadata?.location || {
        city: user.user_metadata?.city || 'San Francisco',
        country: user.user_metadata?.country || 'United States',
        coordinates: {
          type: 'Point',
          coordinates: [user.user_metadata?.longitude || -122.4194, user.user_metadata?.latitude || 37.7749]
        }
      },
      demographics: user.user_metadata?.demographics || {
        generation: user.user_metadata?.generation || 'Millennial',
        gender: user.user_metadata?.gender || 'Not specified',
        ageRange: user.user_metadata?.age ? `${user.user_metadata.age}-${user.user_metadata.age + 5}` : '25-35'
      },
      professional: user.user_metadata?.professional || {
        seniority: user.user_metadata?.seniority || 'Mid-level',
        primaryIndustry: user.user_metadata?.industry || 'Technology',
        secondaryIndustry: user.user_metadata?.secondary_industry || 'Business',
        companySize: user.user_metadata?.company_size || '50-200',
        yearsExperience: user.user_metadata?.years_experience || 5
      },
      psychographics: user.user_metadata?.psychographics || {
        techAdoption: 5,
        riskTolerance: 5,
        priceSensitivity: 5,
        influenceScore: 5,
        brandLoyalty: 5
      },
      interests: user.user_metadata?.interests || ['Technology', 'Business', 'Innovation'],
      personality: user.user_metadata?.personality || {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5
      },
      user_id: user.user_id,
      country: user.user_metadata?.country || 'United States',
      age: user.user_metadata?.age || 30,
      occupation: user.user_metadata?.occupation || user.user_metadata?.title || 'Professional',
      lifestyle: user.user_metadata?.lifestyle || ['Tech-savvy', 'Professional'],
      likes_about_niche: user.user_metadata?.niche_likes || 'Innovation and efficiency',
      dislikes_about_niche: user.user_metadata?.niche_dislikes || 'Complexity and high costs',
      use_cases: user.user_metadata?.use_cases || ['Professional development', 'Productivity'],
      purchase_intent: user.user_metadata?.purchase_intent || 'Moderate',
      user_type: user.user_metadata?.user_type || 'Early adopter',
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    }));
    
    return NextResponse.json({ 
      success: true, 
      users: profiles,
      total: totalCount,
      niche: niche || 'all',
      limit: limit
    });

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