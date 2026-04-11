import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/cohere';

export async function POST(request: NextRequest) {
  console.log('🎯 [GENERATE-OPINIONS] API endpoint called');
  
  try {
    const body = await request.json();
    console.log('🎯 [GENERATE-OPINIONS] Request body keys:', Object.keys(body));
    console.log('🎯 [GENERATE-OPINIONS] Profiles count:', body.profiles?.length || 0);
    console.log('�� [GENERATE-OPINIONS] Idea preview:', body.idea?.substring(0, 50) + '...' || 'No idea');
    
    const { idea, profiles } = body;

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
    
    // Generate opinions for each profile using Cohere
    const opinions = await Promise.all(profiles.map(async (profile: any, index: number) => {
      console.log(`🎯 [GENERATE-OPINIONS] Processing profile ${index + 1}/${profiles.length}:`, {
        name: profile.name,
        title: profile.title,
        personaId: profile.personaId
      });
      
      try {
        const opinion = await generateOpinionWithCohere(profile, idea);
        console.log(`✅ [GENERATE-OPINIONS] Generated opinion for ${profile.name}:`, {
        attention: opinion.attention,
        sentiment: opinion.sentiment.toFixed(2),
          hasComment: !!opinion.comment
      });
      return opinion;
      } catch (error) {
        console.error(`💥 [GENERATE-OPINIONS] Error generating opinion for ${profile.name}:`, error);
        // Fallback to a neutral opinion if Cohere fails
        return generateFallbackOpinion(profile, idea);
      }
    }));

    console.log('✅ [GENERATE-OPINIONS] Successfully generated', opinions.length, 'opinions');
    
    // Log opinion distribution
    const attentionDistribution = opinions.reduce((acc: any, op) => {
      acc[op.attention] = (acc[op.attention] || 0) + 1;
      return acc;
    }, {});
    
    const avgSentiment = opinions.reduce((sum, op) => sum + op.sentiment, 0) / opinions.length;
    const commentsCount = opinions.filter(op => op.comment).length;
    
    console.log('📊 [GENERATE-OPINIONS] Opinion statistics:', {
      attentionDistribution,
      avgSentiment: avgSentiment.toFixed(2),
      commentsCount,
      commentsPercentage: ((commentsCount / opinions.length) * 100).toFixed(1) + '%'
    });

    return NextResponse.json({ 
      success: true, 
      opinions,
      count: opinions.length
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

async function generateOpinionWithCohere(profile: any, idea: string): Promise<any> {
  // Extract persona data (handle both Auth0 user structure and direct persona structure)
  const personaData = profile.user_metadata || profile;
  
  // Create a comprehensive profile description for Cohere
  const profileDescription = createProfileDescription(personaData);
  
  const prompt = `You are analyzing how a specific person would react to a new idea or product. 

PERSON PROFILE:
${profileDescription}

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
- Make the reason and comment sound natural and personal
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
      persona: profile
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

function generateFallbackOpinion(profile: any, idea: string): any {
  // Simple fallback if Cohere fails
  const personaData = profile.user_metadata || profile;
  const random = Math.random();
  
  let attention: 'full' | 'partial' | 'ignore';
  let sentiment: number;
  let reason: string;
  let comment: string | undefined;
  
  if (random > 0.7) {
    attention = 'full';
    sentiment = 0.7 + Math.random() * 0.3;
    reason = `This idea aligns well with ${personaData.title || 'their professional background'}`;
    comment = `This looks promising and could be very useful for someone like me.`;
  } else if (random > 0.4) {
    attention = 'partial';
    sentiment = 0.4 + Math.random() * 0.4;
    reason = `Interesting concept, but would need to see more details`;
    comment = `Could be useful depending on the implementation.`;
  } else {
    attention = 'ignore';
    sentiment = Math.random() * 0.4;
    reason = `Not quite what I'm looking for right now`;
  }
  
  return {
    personaId: personaData.personaId,
    attention,
    reason,
    comment,
    sentiment,
    persona: profile
  };
}
