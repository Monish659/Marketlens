import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/cohere';

const MAX_AI_OPINIONS = 12;
const AI_BATCH_SIZE = 6;
const AI_TIMEOUT_MS = 3500;

type RiskTolerance = 'low' | 'medium' | 'high';
type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';
type GoToMarketMode = 'online' | 'hybrid' | 'offline';

type AudienceConstraints = {
  budget?: string;
  riskTolerance?: RiskTolerance;
  experience?: ExperienceLevel;
  location?: string;
  goToMarket?: GoToMarketMode;
};

type MarketRecommendation = {
  mode: GoToMarketMode;
  bestCity: string;
  bestCountry: string;
  reason: string;
  confidence: number;
} | null;

const REGIONAL_CONTEXT: Record<
  string,
  {
    laws: string;
    economy: string;
    politics: string;
    socioeconomic: string;
    techAdoptionBias: number;
  }
> = {
  'united states': {
    laws: 'Strict liability and consumer protection requirements across states',
    economy: 'High purchasing power with strong competition and premium expectations',
    politics: 'Policy shifts can vary by state and administration',
    socioeconomic: 'Wide income variance; enterprise and consumer segments behave differently',
    techAdoptionBias: 0.2,
  },
  india: {
    laws: 'Strong data handling scrutiny and compliance expectations around digital services',
    economy: 'Price-sensitive mass market with large growth in digital adoption',
    politics: 'Policy can strongly influence platform, payment, and telecom dynamics',
    socioeconomic: 'Large urban-rural gap; localization and affordability matter',
    techAdoptionBias: 0.1,
  },
  germany: {
    laws: 'High compliance expectations, especially privacy and quality standards',
    economy: 'Stable market with quality-first purchasing decisions',
    politics: 'Regulatory predictability but strong standards enforcement',
    socioeconomic: 'Users reward reliability, documentation, and trust',
    techAdoptionBias: 0.08,
  },
  brazil: {
    laws: 'Consumer and privacy regulations are meaningful for product-market fit',
    economy: 'High growth potential with price sensitivity in key segments',
    politics: 'Policy and macro stability can affect adoption confidence',
    socioeconomic: 'Mobile-first behavior and social proof strongly influence adoption',
    techAdoptionBias: 0.06,
  },
  nigeria: {
    laws: 'Compliance and trust signals are important for adoption',
    economy: 'High upside market with strong cost constraints',
    politics: 'Policy and infrastructure reliability can affect growth pace',
    socioeconomic: 'Underserved segments need practical utility and affordability',
    techAdoptionBias: -0.02,
  },
};

export async function POST(request: NextRequest) {
  console.log('🎯 [GENERATE-OPINIONS] API endpoint called');
  
  try {
    const body = await request.json();
    console.log('🎯 [GENERATE-OPINIONS] Request body keys:', Object.keys(body));
    console.log('🎯 [GENERATE-OPINIONS] Profiles count:', body.profiles?.length || 0);
    console.log('�� [GENERATE-OPINIONS] Idea preview:', body.idea?.substring(0, 50) + '...' || 'No idea');
    
    const { idea, profiles, scenarioContext } = body;
    const constraints = normalizeAudienceConstraints(scenarioContext?.audienceConstraints);

    if (!idea || !profiles || !Array.isArray(profiles)) {
      console.error('💥 [GENERATE-OPINIONS] Invalid input:', { 
        hasIdea: !!idea, 
        hasProfiles: !!profiles, 
        isProfilesArray: Array.isArray(profiles),
        profilesLength: profiles?.length 
      });
      return NextResponse.json({ error: 'Idea and profiles are required' }, { status: 400 });
    }

    console.log('🎯 [GENERATE-OPINIONS] Processing', profiles.length, 'profiles for idea analysis');

    const hasCohereKey = !!process.env.COHERE_API_KEY;
    const aiTargetCount = hasCohereKey ? Math.min(MAX_AI_OPINIONS, profiles.length) : 0;
    const opinions: any[] = new Array(profiles.length);

    if (aiTargetCount > 0) {
      console.log(`🎯 [GENERATE-OPINIONS] Using Cohere for first ${aiTargetCount} profiles, fallback for remaining ${profiles.length - aiTargetCount}`);

      for (let i = 0; i < aiTargetCount; i += AI_BATCH_SIZE) {
        const batch = profiles.slice(i, Math.min(i + AI_BATCH_SIZE, aiTargetCount));
        const batchOpinions = await Promise.all(
          batch.map(async (profile: any) => {
            try {
              const opinion = await withTimeout(
                generateOpinionWithCohere(profile, idea, scenarioContext, constraints),
                AI_TIMEOUT_MS,
                `Cohere timeout for ${profile?.name || profile?.user_metadata?.name || 'persona'}`
              );
              return opinion;
            } catch (error) {
              console.warn(`⚠️ [GENERATE-OPINIONS] Falling back for ${profile?.name || profile?.user_metadata?.name || 'persona'}:`, error);
              return generateFallbackOpinion(profile, idea, scenarioContext, constraints);
            }
          })
        );

        batchOpinions.forEach((opinion, index) => {
          opinions[i + index] = opinion;
        });
      }
    } else {
      console.warn('⚠️ [GENERATE-OPINIONS] COHERE_API_KEY missing or disabled, using fallback opinions only');
    }

    // Fill any missing entries (including profiles beyond AI sample limit) with fast fallback opinions.
    for (let i = 0; i < profiles.length; i++) {
      if (!opinions[i]) {
        opinions[i] = generateFallbackOpinion(profiles[i], idea, scenarioContext, constraints);
      }
    }

    const locationAwareOpinions = opinions.map((opinion, index) =>
      applyRegionalBehavior(opinion, profiles[index], scenarioContext, constraints, idea)
    );

    console.log('✅ [GENERATE-OPINIONS] Successfully generated', locationAwareOpinions.length, 'opinions');
    
    // Log opinion distribution
    const attentionDistribution = locationAwareOpinions.reduce((acc: any, op) => {
      acc[op.attention] = (acc[op.attention] || 0) + 1;
      return acc;
    }, {});
    
    const avgSentiment =
      locationAwareOpinions.reduce((sum, op) => sum + op.sentiment, 0) /
      Math.max(1, locationAwareOpinions.length);
    const commentsCount = locationAwareOpinions.filter(op => op.comment).length;
    const marketRecommendation = computeMarketRecommendation(locationAwareOpinions, constraints, idea);
    
    console.log('📊 [GENERATE-OPINIONS] Opinion statistics:', {
      attentionDistribution,
      avgSentiment: avgSentiment.toFixed(2),
      commentsCount,
      commentsPercentage: ((commentsCount / opinions.length) * 100).toFixed(1) + '%'
    });

    return NextResponse.json({ 
      success: true, 
      opinions: locationAwareOpinions,
      count: locationAwareOpinions.length,
      marketRecommendation,
    });

  } catch (error) {
    console.error('💥 [GENERATE-OPINIONS] Error occurred:', error);
    console.error('💥 [GENERATE-OPINIONS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to generate opinions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function generateOpinionWithCohere(
  profile: any,
  idea: string,
  scenarioContext?: any,
  audienceConstraints?: AudienceConstraints
): Promise<any> {
  // Extract persona data (handle both Auth0 user structure and direct persona structure)
  const personaData = profile.user_metadata || profile;
  
  // Create a comprehensive profile description for Cohere
  const profileDescription = createProfileDescription(personaData);
  
  const normalizedConstraints = normalizeAudienceConstraints(
    audienceConstraints || scenarioContext?.audienceConstraints
  );
  const regionalContext = buildRegionalContextText(personaData, normalizedConstraints);

  const prompt = `You are analyzing how a specific person would react to a new idea or product. 

PERSON PROFILE:
${profileDescription}

MACRO SCENARIO (0-100, 50=neutral):
${JSON.stringify(scenarioContext || {
  inflation: 50,
  marketRisk: 50,
  geopoliticalStress: 50,
  regulationStrictness: 50,
  economicGrowth: 50
}, null, 2)}

ADDITIONAL AUDIENCE CONSTRAINTS:
${JSON.stringify(normalizedConstraints, null, 2)}

REGIONAL CONTEXT TO APPLY:
${regionalContext}

IDEA TO ANALYZE:
"${idea}"

Based on this person's characteristics, background, interests, and personality, analyze how they would likely react to this idea. Consider their professional background, demographics, psychographics, location, and any other relevant factors.

IMPORTANT: When writing the "reason" field, refer to this person as "${personaData.name}" or use "they/them" pronouns. Do NOT mention any other names or refer to other people.

Respond with a JSON object containing:
{
  "attention": "full" | "partial" | "ignore",
  "sentiment": number between 0 and 1,
  "reason": "Brief explanation of why ${personaData.name} would react this way (1-2 sentences). Only refer to ${personaData.name} or use 'they/them' pronouns.",
  "comment": "Optional personal comment ${personaData.name} might make. Make sure its suggestions / feature suggestions to incorporate into the idea."
}

Guidelines:
- "full" attention: They would be very interested and likely to engage
- "partial" attention: They would be somewhat interested but have reservations
- "ignore" attention: They would not be interested or would dismiss it
- sentiment: 0.0 = very negative, 0.5 = neutral, 1.0 = very positive
- Be realistic based on their actual characteristics
- Consider their professional background, age, interests, and lifestyle
- Consider budget/risk/region constraints when deciding practicality
- Explicitly factor local laws, economy, politics, and socioeconomic context from the regional context section
- For online launches, include whether this person believes their city/country is a strong initial launch market
- Make the reason and comment sound natural and personal
- For "ignore" and "partial" attention, provide constructive, specific rejection reasoning that helps improve the idea
- NEVER mention names other than ${personaData.name} in your response`;

  try {
    const response = await chatCompletion([
      {
        role: 'user',
        content: prompt
      }
    ], {
      model: 'command-r-08-2024',
      temperature: 0.7,
      maxTokens: 700
    });

    // Parse the JSON response from Cohere
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Cohere response');
    }

    const opinion = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!opinion.attention || !['full', 'partial', 'ignore'].includes(opinion.attention)) {
      throw new Error('Invalid attention level');
    }
    
    if (typeof opinion.sentiment !== 'number' || opinion.sentiment < 0 || opinion.sentiment > 1) {
      throw new Error('Invalid sentiment value');
    }

    // Ensure comment is only present for full or partial attention
    if (opinion.attention === 'ignore') {
      opinion.comment = undefined;
    }

    return {
      personaId: personaData.personaId,
      attention: opinion.attention,
      reason: opinion.reason,
      comment: opinion.comment,
      sentiment: opinion.sentiment,
      persona: normalizePersonaForOpinion(profile),
    };

  } catch (error) {
    console.error('💥 [GENERATE-OPINIONS] Cohere generation failed:', error);
    throw error;
  }
}

function createProfileDescription(personaData: any): string {
  const parts = [];
  
  // Basic info
  if (personaData.name) parts.push(`Name: ${personaData.name}`);
  if (personaData.title) parts.push(`Job Title: ${personaData.title}`);
  if (personaData.email) parts.push(`Email: ${personaData.email}`);
  
  // Demographics
  if (personaData.demographics) {
    const demo = personaData.demographics;
    if (demo.generation) parts.push(`Generation: ${demo.generation}`);
    if (demo.gender) parts.push(`Gender: ${demo.gender}`);
    if (demo.ageRange) parts.push(`Age Range: ${demo.ageRange}`);
  }
  
  // Professional background
  if (personaData.professional) {
    const prof = personaData.professional;
    if (prof.primaryIndustry) parts.push(`Industry: ${prof.primaryIndustry}`);
    if (prof.secondaryIndustry) parts.push(`Secondary Industry: ${prof.secondaryIndustry}`);
    if (prof.seniority) parts.push(`Seniority Level: ${prof.seniority}`);
    if (prof.companySize) parts.push(`Company Size: ${prof.companySize}`);
    if (prof.yearsExperience) parts.push(`Years of Experience: ${prof.yearsExperience}`);
  }
  
  // Psychographics
  if (personaData.psychographics) {
    const psycho = personaData.psychographics;
    if (psycho.techAdoption !== undefined) parts.push(`Tech Adoption Score: ${psycho.techAdoption}/10`);
    if (psycho.riskTolerance !== undefined) parts.push(`Risk Tolerance: ${psycho.riskTolerance}/10`);
    if (psycho.priceSensitivity !== undefined) parts.push(`Price Sensitivity: ${psycho.priceSensitivity}/10`);
    if (psycho.influenceScore !== undefined) parts.push(`Influence Score: ${psycho.influenceScore}/10`);
    if (psycho.brandLoyalty !== undefined) parts.push(`Brand Loyalty: ${psycho.brandLoyalty}/10`);
  }
  
  // Interests
  if (personaData.interests && Array.isArray(personaData.interests)) {
    parts.push(`Interests: ${personaData.interests.join(', ')}`);
  }
  
  // Personality traits
  if (personaData.personality) {
    const personality = personaData.personality;
    parts.push(`Personality Traits:`);
    if (personality.openness !== undefined) parts.push(`  - Openness: ${personality.openness}`);
    if (personality.conscientiousness !== undefined) parts.push(`  - Conscientiousness: ${personality.conscientiousness}`);
    if (personality.extraversion !== undefined) parts.push(`  - Extraversion: ${personality.extraversion}`);
    if (personality.agreeableness !== undefined) parts.push(`  - Agreeableness: ${personality.agreeableness}`);
    if (personality.neuroticism !== undefined) parts.push(`  - Neuroticism: ${personality.neuroticism}`);
  }
  
  // Location
  if (personaData.location) {
    const loc = personaData.location;
    if (loc.city && loc.country) {
      parts.push(`Location: ${loc.city}, ${loc.country}`);
    }
  }
  
  // Data sources
  if (personaData.dataSources && Array.isArray(personaData.dataSources)) {
    parts.push(`Data Sources: ${personaData.dataSources.join(', ')}`);
  }
  
  return parts.join('\n');
}

function normalizePersonaForOpinion(profile: any) {
  const personaData = profile?.user_metadata || profile || {};
  const fallbackTitle =
    personaData.title ||
    personaData.occupation ||
    (personaData.professional?.seniority && personaData.professional?.primaryIndustry
      ? `${personaData.professional.seniority} ${personaData.professional.primaryIndustry}`
      : personaData.professional?.primaryIndustry) ||
    'Professional';

  const normalizedPersona = {
    ...personaData,
    title: fallbackTitle,
  };

  return profile?.user_metadata
    ? { ...profile, user_metadata: normalizedPersona, title: profile.title || fallbackTitle }
    : normalizedPersona;
}

function generateFallbackOpinion(
  profile: any,
  idea: string,
  scenarioContext?: any,
  audienceConstraints?: AudienceConstraints
): any {
  const personaData = profile.user_metadata || profile;
  const random = Math.random();
  
  let attention: 'full' | 'partial' | 'ignore';
  let sentiment: number;
  let reason: string;
  let comment: string | undefined;
  
  const riskPenalty = ((scenarioContext?.marketRisk ?? 50) - 50) / 100;
  const inflationPenalty = ((scenarioContext?.inflation ?? 50) - 50) / 120;
  const growthBoost = ((scenarioContext?.economicGrowth ?? 50) - 50) / 100;
  const normalizedConstraints = normalizeAudienceConstraints(
    audienceConstraints || scenarioContext?.audienceConstraints
  );
  const scenarioShift = growthBoost - riskPenalty - inflationPenalty;
  const regionContext = getRegionalContext(personaData, normalizedConstraints);
  const regionBias = regionContext.techAdoptionBias;
  const adjusted = random + scenarioShift + regionBias;
  const locationMatchBoost = isLocationMatch(personaData, normalizedConstraints.location) ? 0.08 : -0.03;
  const constraintsText = [
    normalizedConstraints?.budget ? `budget ${normalizedConstraints.budget}` : null,
    normalizedConstraints?.riskTolerance ? `risk ${normalizedConstraints.riskTolerance}` : null,
    normalizedConstraints?.experience ? `experience ${normalizedConstraints.experience}` : null,
    normalizedConstraints?.location ? `location ${normalizedConstraints.location}` : null,
    normalizedConstraints?.goToMarket ? `go-to-market ${normalizedConstraints.goToMarket}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const finalAdjusted = adjusted + locationMatchBoost;

  if (finalAdjusted > 0.7) {
    attention = 'full';
    sentiment = Math.max(0.55, 0.7 + Math.random() * 0.25 + scenarioShift + regionBias);
    reason = `This aligns with ${personaData.title || 'their professional background'} and feels feasible in ${personaData.location?.city || 'their market'} given ${regionContext.economy.toLowerCase()}${constraintsText ? ` under ${constraintsText}` : ''}.`;
    comment = `Strong potential if execution stays practical for local regulations and pricing expectations.`;
  } else if (finalAdjusted > 0.4) {
    attention = 'partial';
    sentiment = Math.max(0.2, Math.min(0.7, 0.42 + Math.random() * 0.3 + scenarioShift + regionBias));
    reason = `Interesting concept, but adoption is uncertain in ${personaData.location?.country || 'this region'} due to ${regionContext.laws.toLowerCase()} and ${regionContext.socioeconomic.toLowerCase()}.`;
    comment = `I need clearer rollout details, pricing transparency, and proof this works in real local conditions.`;
  } else {
    attention = 'ignore';
    sentiment = Math.max(0, Math.min(0.35, Math.random() * 0.3 + scenarioShift + regionBias));
    reason = `Not compelling yet because the value proposition does not overcome local constraints around ${regionContext.politics.toLowerCase()} and ${regionContext.socioeconomic.toLowerCase()}${constraintsText ? ` given ${constraintsText}` : ''}.`;
    comment = undefined;
  }
  
  return {
    personaId: personaData.personaId,
    attention,
    reason,
    comment,
    sentiment,
    persona: normalizePersonaForOpinion(profile),
  };
}

function normalizeAudienceConstraints(input?: AudienceConstraints): Required<AudienceConstraints> {
  return {
    budget: input?.budget || '',
    riskTolerance: input?.riskTolerance || 'medium',
    experience: input?.experience || 'intermediate',
    location: input?.location || 'Global',
    goToMarket: input?.goToMarket || 'online',
  };
}

function normalizeLocation(input?: string | null) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s,-]/g, '');
}

function getRegionalContext(personaData: any, constraints: Required<AudienceConstraints>) {
  const country = normalizeLocation(personaData?.location?.country);
  if (country && REGIONAL_CONTEXT[country]) return REGIONAL_CONTEXT[country];

  const target = normalizeLocation(constraints.location);
  if (target && REGIONAL_CONTEXT[target]) return REGIONAL_CONTEXT[target];

  return {
    laws: 'Standard compliance and trust expectations',
    economy: 'Mixed purchasing power with practical ROI expectations',
    politics: 'Moderate policy uncertainty',
    socioeconomic: 'Adoption depends on affordability, education, and local infrastructure',
    techAdoptionBias: 0,
  };
}

function buildRegionalContextText(personaData: any, constraints: Required<AudienceConstraints>) {
  const ctx = getRegionalContext(personaData, constraints);
  return [
    `Laws: ${ctx.laws}`,
    `Economy: ${ctx.economy}`,
    `Politics: ${ctx.politics}`,
    `Socioeconomic: ${ctx.socioeconomic}`,
  ].join('\n');
}

function isLocationMatch(personaData: any, targetLocation?: string) {
  const target = normalizeLocation(targetLocation);
  if (!target || target === 'global' || target === 'worldwide') return true;
  const city = normalizeLocation(personaData?.location?.city);
  const country = normalizeLocation(personaData?.location?.country);
  if (!city && !country) return false;
  if (city.includes(target) || country.includes(target)) return true;
  return target.split(/[,\s]+/).some((token) => token.length > 2 && (city.includes(token) || country.includes(token)));
}

function applyRegionalBehavior(
  opinion: any,
  profile: any,
  scenarioContext: any,
  constraints: Required<AudienceConstraints>,
  idea: string
) {
  const persona = profile?.user_metadata || profile || {};
  const region = getRegionalContext(persona, constraints);

  const experienceModifier =
    constraints.experience === 'beginner' ? -0.08 :
    constraints.experience === 'expert' ? 0.06 : 0;
  const riskModifier =
    constraints.riskTolerance === 'low' ? -0.05 :
    constraints.riskTolerance === 'high' ? 0.03 : 0;
  const locationModifier = isLocationMatch(persona, constraints.location) ? 0.05 : -0.06;
  const scenarioRiskModifier =
    ((scenarioContext?.marketRisk ?? 50) - 50) / 160 +
    ((scenarioContext?.regulationStrictness ?? 50) - 50) / 180;
  const onlineBoost =
    constraints.goToMarket === 'online' && /\b(online|web|saas|mobile|platform|digital)\b/i.test(idea)
      ? 0.05
      : 0;

  const sentimentShift =
    region.techAdoptionBias + experienceModifier + riskModifier + locationModifier + onlineBoost - scenarioRiskModifier;

  const sentiment = Math.max(0, Math.min(1, (Number(opinion?.sentiment) || 0.5) + sentimentShift));
  let attention: 'full' | 'partial' | 'ignore' = opinion?.attention || 'partial';
  if (sentiment >= 0.7) attention = 'full';
  else if (sentiment <= 0.36) attention = 'ignore';
  else attention = 'partial';

  const reasoningTail = `Regional factors considered: laws (${region.laws}), economy (${region.economy}), politics (${region.politics}), socioeconomic context (${region.socioeconomic}).`;
  const reason = `${opinion?.reason || 'No reason generated.'} ${reasoningTail}`.trim();
  const comment =
    attention === 'ignore'
      ? undefined
      : opinion?.comment ||
        (attention === 'partial'
          ? 'Show region-specific proof, risk controls, and pricing fit to improve adoption.'
          : 'Good potential here if execution remains localized and practical.');

  return {
    ...opinion,
    attention,
    sentiment,
    reason,
    comment,
    persona: normalizePersonaForOpinion(profile),
  };
}

function inferGoToMarketMode(idea: string, constraints: Required<AudienceConstraints>): GoToMarketMode {
  if (constraints.goToMarket) return constraints.goToMarket;
  if (/\b(online|web|saas|app|digital|global)\b/i.test(idea)) return 'online';
  if (/\b(hybrid|online and offline)\b/i.test(idea)) return 'hybrid';
  return 'offline';
}

function computeMarketRecommendation(
  opinions: any[],
  constraints: Required<AudienceConstraints>,
  idea: string
): MarketRecommendation {
  const mode = inferGoToMarketMode(idea, constraints);
  if (mode !== 'online') return null;

  const scoreByLocation = new Map<string, { city: string; country: string; score: number; samples: number }>();

  for (const opinion of opinions) {
    const persona = opinion?.persona?.user_metadata || opinion?.persona || {};
    const city = String(persona?.location?.city || 'Unknown');
    const country = String(persona?.location?.country || 'Unknown');
    const key = `${city}|${country}`;
    const prev = scoreByLocation.get(key) || { city, country, score: 0, samples: 0 };
    const attentionWeight =
      opinion.attention === 'full' ? 1.15 :
      opinion.attention === 'partial' ? 0.25 : -0.9;
    const sentimentWeight = (Number(opinion.sentiment) || 0.5) - 0.5;
    prev.score += attentionWeight + sentimentWeight;
    prev.samples += 1;
    scoreByLocation.set(key, prev);
  }

  const best = Array.from(scoreByLocation.values())
    .filter((entry) => entry.samples > 0)
    .sort((a, b) => b.score / b.samples - a.score / a.samples)[0];

  if (!best) return null;

  const confidence = Math.max(0, Math.min(1, (best.score / Math.max(1, best.samples) + 1.5) / 3));
  return {
    mode: 'online',
    bestCity: best.city,
    bestCountry: best.country,
    reason: `${best.city}, ${best.country} shows the strongest approval profile for online rollout in this simulation while matching your risk and experience constraints.`,
    confidence: Number(confidence.toFixed(2)),
  };
}
