import { NextRequest, NextResponse } from 'next/server';
import { rerank } from '@/lib/cohere';

export async function POST(request: NextRequest) {
  console.log('🎯 [SELECT-NICHE-USERS] API endpoint called');
  
  try {
    const body = await request.json();
    const { niche, users, prompt, limit = 100 } = body; // Add limit with default of 5

    if (!niche || !users || !Array.isArray(users)) {
      console.error('💥 [SELECT-NICHE-USERS] Invalid input:', { 
        hasNiche: !!niche, 
        hasUsers: !!users, 
        isUsersArray: Array.isArray(users),
        usersLength: users?.length 
      });
      return NextResponse.json({ 
        error: 'Niche and users array are required' 
      }, { status: 400 });
    }

    console.log('🔍 [SELECT-NICHE-USERS] Processing', users.length, 'users for niche:', niche);
    console.log('🔍 [SELECT-NICHE-USERS] Original prompt:', prompt?.substring(0, 100) + '...');
    console.log('🔍 [SELECT-NICHE-USERS] Limit set to:', limit);

    // Create user profile summaries for Cohere reranking
    const userDocuments = users.map((user: any) => {
      const profileText = createUserProfileText(user, niche);
      return {
        userId: user.user_id || user.personaId,
        text: profileText,
        user: user
      };
    });

    console.log('📝 [SELECT-NICHE-USERS] Created', userDocuments.length, 'user profile documents');
    console.log('📝 [SELECT-NICHE-USERS] Sample profile text:', userDocuments[0]?.text.substring(0, 150) + '...');

    // Create a comprehensive query for Cohere reranking
    const query = createNicheQuery(niche, prompt);
    console.log('🔍 [SELECT-NICHE-USERS] Reranking query:', query);

    // Use Cohere rerank to find the most relevant users
    const rerankResults = await rerank(
      query,
      userDocuments.map(doc => doc.text),
      {
        model: 'rerank-english-v3.0',
        topN: Math.min(limit, userDocuments.length) // Use the limit parameter, but don't exceed available users
      }
    );

    console.log('✅ [SELECT-NICHE-USERS] Cohere rerank completed, got', rerankResults.length, 'results');

    // Map rerank results back to user objects
    const selectedUsers = rerankResults.map((result: any) => {
      const originalDoc = userDocuments[result.index];
      // Cohere returns 'relevanceScore' (camelCase)
      const score = result.relevanceScore || 0;
      return {
        ...originalDoc.user,
        relevanceScore: score,
        profileSummary: originalDoc.text
      };
    });

    // Log relevance score distribution
    const scores = selectedUsers.map(u => u.relevanceScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    console.log('📊 [SELECT-NICHE-USERS] Relevance scores:', {
      count: selectedUsers.length,
      average: avgScore.toFixed(3),
      max: maxScore.toFixed(3),
      min: minScore.toFixed(3),
      highRelevance: scores.filter(s => s > 0.8).length,
      mediumRelevance: scores.filter(s => s > 0.5 && s <= 0.8).length,
      lowRelevance: scores.filter(s => s <= 0.5).length
    });

    // Log top selected users for debugging
    console.log(`🏆 [SELECT-NICHE-USERS] Top ${Math.min(5, selectedUsers.length)} selected users:`);
    selectedUsers.slice(0, Math.min(5, selectedUsers.length)).forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.name} (${user.relevanceScore.toFixed(3)}) - ${user.title || user.occupation}`);
    }); 

    return NextResponse.json({ 
      success: true, 
      selectedUsers: selectedUsers,
      totalProcessed: users.length,
      totalSelected: selectedUsers.length,
      niche: niche,
      averageRelevanceScore: avgScore
    });

  } catch (error) {
    console.error('💥 [SELECT-NICHE-USERS] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to select niche users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function createUserProfileText(user: any, niche: string): string {
  // Handle both direct persona data and Auth0 user with user_metadata
  const persona = user.user_metadata || user;
  
  // Create a comprehensive profile text that Cohere can use for relevance matching
  const parts = [];
  
  // Basic info
  if (user.name || persona.name) parts.push(`Name: ${user.name || persona.name}`);
  if (persona.title) parts.push(`Occupation: ${persona.title}`);
  if (persona.demographics?.ageRange) parts.push(`Age: ${persona.demographics.ageRange}`);
  
  // Professional background
  if (persona.professional?.primaryIndustry) parts.push(`Industry: ${persona.professional.primaryIndustry}`);
  if (persona.professional?.seniority) parts.push(`Seniority: ${persona.professional.seniority}`);
  if (persona.professional?.companySize) parts.push(`Company Size: ${persona.professional.companySize}`);
  
  // Demographics and psychographics
  if (persona.demographics?.generation) parts.push(`Generation: ${persona.demographics.generation}`);
  
  // Interests - MOST IMPORTANT for matching
  if (persona.interests && Array.isArray(persona.interests)) {
    parts.push(`Interests: ${persona.interests.join(', ')}`);
  }
  
  // Psychographic scores
  if (persona.psychographics) {
    const psycho = persona.psychographics;
    if (psycho.techAdoption !== undefined) parts.push(`Tech Adoption: ${psycho.techAdoption}/10`);
    if (psycho.riskTolerance !== undefined) parts.push(`Risk Tolerance: ${psycho.riskTolerance}/10`);
    if (psycho.influenceScore !== undefined) parts.push(`Influence Score: ${psycho.influenceScore}/10`);
    if (psycho.priceSensitivity !== undefined) parts.push(`Price Sensitivity: ${psycho.priceSensitivity}/10`);
  }
  
  // Location context
  if (persona.location?.city && persona.location?.country) {
    parts.push(`Location: ${persona.location.city}, ${persona.location.country}`);
  }
  
  return parts.join('. ');
}

function createNicheQuery(niche: string, originalPrompt?: string): string {
  // Create a more discriminating query that will properly differentiate between users
  let query = `Find users who are most likely to be interested in ${niche}`;
  
  if (originalPrompt) {
    query += `. The specific product/service is: ${originalPrompt}`;
  }
  
  // Make the criteria more specific and demanding
  query += `. Rank users based on their relevance to this specific niche. `;
  query += `Only users with direct experience, strong interest, or clear potential in ${niche} should score highly. `;
  query += `Users with unrelated backgrounds or no clear connection to ${niche} should score low. `;
  query += `Be discriminating - most users should not be highly relevant. `;
  query += `Focus on users who would actually engage with or purchase ${niche}.`;
  
  return query;
}
