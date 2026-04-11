import { NextRequest, NextResponse } from 'next/server';
import { getManagementClient } from '@/lib/auth0-management';
import bundledPersonas from '../../../../personas.json';

type AnyRecord = Record<string, any>;

const GEO_CITY_FALLBACKS = [
  { city: 'London', country: 'United Kingdom', coordinates: [-0.1276, 51.5072] },
  { city: 'Lagos', country: 'Nigeria', coordinates: [3.3792, 6.5244] },
  { city: 'Tokyo', country: 'Japan', coordinates: [139.6917, 35.6895] },
  { city: 'Sao Paulo', country: 'Brazil', coordinates: [-46.6333, -23.5505] },
  { city: 'Dubai', country: 'UAE', coordinates: [55.2708, 25.2048] },
  { city: 'Toronto', country: 'Canada', coordinates: [-79.3832, 43.6532] },
  { city: 'Sydney', country: 'Australia', coordinates: [151.2093, -33.8688] },
  { city: 'Mumbai', country: 'India', coordinates: [72.8777, 19.076] },
  { city: 'Cape Town', country: 'South Africa', coordinates: [18.4241, -33.9249] },
  { city: 'Berlin', country: 'Germany', coordinates: [13.405, 52.52] },
  { city: 'Singapore', country: 'Singapore', coordinates: [103.8198, 1.3521] },
  { city: 'Mexico City', country: 'Mexico', coordinates: [-99.1332, 19.4326] },
];

function hashToPositiveInt(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function inferProfileFromRecord(record: AnyRecord, index = 0) {
  const email: string = record.email || '';
  const fallbackName = email ? email.split('@')[0] : `user_${index + 1}`;
  const metadata = record.user_metadata || record.raw_user_meta_data || {};
  const citySeed = GEO_CITY_FALLBACKS[index % GEO_CITY_FALLBACKS.length];
  const fullName = record.name || metadata.name || fallbackName;

  const lat = typeof metadata.latitude === 'number' ? metadata.latitude : citySeed.coordinates[1];
  const lon = typeof metadata.longitude === 'number' ? metadata.longitude : citySeed.coordinates[0];

  return {
    personaId: metadata.personaId || hashToPositiveInt(record.user_id || record.id || `${email}-${index}`),
    name: fullName,
    title: metadata.title || metadata.occupation || 'Professional',
    email,
    location: metadata.location || {
      city: metadata.city || citySeed.city,
      country: metadata.country || citySeed.country,
      coordinates: {
        type: 'Point',
        coordinates: [lon, lat],
      },
    },
    demographics: metadata.demographics || {
      generation: metadata.generation || 'Millennial',
      gender: metadata.gender || 'Not specified',
      ageRange: metadata.age ? `${metadata.age}-${metadata.age + 5}` : '25-35',
    },
    professional: metadata.professional || {
      seniority: metadata.seniority || 'Mid-level',
      primaryIndustry: metadata.industry || 'Technology',
      secondaryIndustry: metadata.secondary_industry || 'Business',
      companySize: metadata.company_size || '50-200',
      yearsExperience: metadata.years_experience || 5,
    },
    psychographics: metadata.psychographics || {
      techAdoption: 5,
      riskTolerance: 5,
      priceSensitivity: 5,
      influenceScore: 5,
      brandLoyalty: 5,
    },
    interests: metadata.interests || ['Technology', 'Business', 'Innovation'],
    personality: metadata.personality || {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5,
    },
    user_id: record.user_id || record.id || `user_${index + 1}`,
    country: metadata.country || citySeed.country,
    age: metadata.age || 30,
    occupation: metadata.occupation || metadata.title || 'Professional',
    lifestyle: metadata.lifestyle || ['Tech-savvy', 'Professional'],
    likes_about_niche: metadata.niche_likes || 'Innovation and efficiency',
    dislikes_about_niche: metadata.niche_dislikes || 'Complexity and high costs',
    use_cases: metadata.use_cases || ['Professional development', 'Productivity'],
    purchase_intent: metadata.purchase_intent || 'Moderate',
    user_type: metadata.user_type || 'Early adopter',
    createdAt: new Date(record.created_at || Date.now()),
    updatedAt: new Date(record.updated_at || Date.now()),
  };
}

function normalizeBundledPersona(persona: AnyRecord, index: number) {
  const data = persona.user_metadata || persona;
  const name = data.name || persona.name || `Persona ${index + 1}`;
  const email =
    data.email ||
    persona.email ||
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}@marketlens.persona`;

  const normalized = {
    ...data,
    personaId: data.personaId || index + 1,
    name,
    title: data.title || data.occupation || 'Professional',
    email,
  };

  return {
    ...normalized,
    user_metadata: normalized,
  };
}

function buildBundledFallback(limit: number, excludeEmail?: string) {
  const sourceRows = Array.isArray(bundledPersonas) ? bundledPersonas : [];
  const normalized = sourceRows.map((persona: AnyRecord, index: number) =>
    normalizeBundledPersona(persona, index)
  );

  const filtered = normalized.filter((profile: AnyRecord) => {
    if (!excludeEmail) return true;
    return String(profile.email || '').toLowerCase() !== excludeEmail.toLowerCase();
  });

  return filtered.slice(0, Math.max(1, limit));
}

function dedupeProfiles(rows: AnyRecord[]) {
  const seen = new Set<string>();
  const out: AnyRecord[] = [];

  for (const row of rows) {
    const key = `${row.personaId || ''}|${String(row.email || '').toLowerCase()}|${String(row.name || '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }

  return out;
}

export async function GET(request: NextRequest) {
  console.log('👥 [FETCH-AUTH0-USERS] API endpoint called');

  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const limit = parseInt(searchParams.get('limit') || '100');
    const excludeEmail = searchParams.get('exclude_email') || undefined;

    console.log('🔍 [FETCH-AUTH0-USERS] Fetching users:', { niche, limit, excludeEmail });

    try {
      const client = getManagementClient();
      // Always prefer seeded/fake persona users in Auth0, never dashboard account users.
      const searchQuery = niche
        ? `app_metadata.is_fake_profile:true AND app_metadata.niche:"${niche}"`
        : 'app_metadata.is_fake_profile:true';

      let allUsers: AnyRecord[] = [];
      let totalCount = 0;
      const perPage = 100;
      const maxPages = Math.ceil(Math.min(limit, 1000) / perPage);

      for (let page = 0; page < maxPages; page++) {
        const response = await client.users.getAll({
          q: searchQuery,
          search_engine: 'v3',
          per_page: perPage,
          page,
          include_totals: true,
        });

        const rawData: AnyRecord = (response as AnyRecord)?.data ?? response;
        const pageUsers: AnyRecord[] = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.users)
            ? rawData.users
            : [];

        if (page === 0) {
          totalCount = typeof rawData?.total === 'number' ? rawData.total : pageUsers.length;
        }

        allUsers = [...allUsers, ...pageUsers];

        if (pageUsers.length < perPage || allUsers.length >= limit) break;
      }

      const profiles = allUsers
        .slice(0, limit)
        .map((user: AnyRecord, index: number) => inferProfileFromRecord(user, index))
        .filter((profile: AnyRecord) => {
          if (!excludeEmail) return true;
          return String(profile.email || '').toLowerCase() !== excludeEmail.toLowerCase();
        });

      const uniqueCountries = new Set(
        profiles
          .map((profile: AnyRecord) => profile.location?.country)
          .filter(Boolean)
      );

      const insufficientCoverage = profiles.length < Math.min(limit, 25) || uniqueCountries.size < 8;
      if (insufficientCoverage) {
        const bundled = buildBundledFallback(limit, excludeEmail);
        const merged = dedupeProfiles([...profiles, ...bundled]).slice(0, Math.max(1, limit));

        return NextResponse.json({
          success: true,
          users: merged,
          total: merged.length,
          niche: niche || 'all',
          limit,
          source: profiles.length > 0 ? 'auth0+bundled' : 'bundled',
        });
      }

      return NextResponse.json({
        success: true,
        users: profiles,
        total: totalCount || profiles.length,
        niche: niche || 'all',
        limit,
        source: 'auth0',
      });
    } catch (auth0Error) {
      console.warn('⚠️ [FETCH-AUTH0-USERS] Auth0 unavailable, using bundled personas fallback:', auth0Error);
      const fallbackUsers = buildBundledFallback(limit, excludeEmail);

      return NextResponse.json({
        success: true,
        users: fallbackUsers,
        total: fallbackUsers.length,
        niche: niche || 'all',
        limit,
        source: 'bundled',
      });
    }
  } catch (error) {
    console.error('💥 [FETCH-AUTH0-USERS] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        users: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
