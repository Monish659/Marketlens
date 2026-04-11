// Martian Integration for Smart LLM Routing
import { IPersona } from '@/models/Persona';
import { PostAnalysis } from './cohere';
import { generateUniqueComment, generateUniqueReason } from './persona-comments';

interface PersonaOpinion {
  attention: 'full' | 'partial' | 'ignore';
  reason: string;
  comment?: string;
  sentiment: number;
}

// Platform-specific prompts
const PLATFORM_CONTEXTS: Record<string, string> = {
  linkedin: "a LinkedIn professional networking post",
  instagram: "an Instagram social media post",
  twitter: "a Twitter/X microblog post",
  tiktok: "a TikTok video script",
  email: "an email communication",
  'email-subject': "an email subject line",
  survey: "a survey question",
  article: "an article or blog post",
  website: "website content",
  ad: "an advertisement",
  product: "a product proposition or launch announcement"
};

const PLATFORM_BEHAVIORS: Record<string, string> = {
  linkedin: "Professional tone, focus on business value, career growth, and industry insights. Comments should be thoughtful and professional.",
  instagram: "Visual and lifestyle focused. Reactions based on aesthetics, trends, and personal appeal. Comments are casual and emoji-friendly.",
  twitter: "Quick, witty responses. Focus on shareability and hot takes. Comments are brief and punchy.",
  tiktok: "Entertainment and trend focused. Youth-oriented perspectives. Comments use Gen Z language and memes.",
  email: "Formal evaluation of relevance and urgency. Focus on whether it warrants a response.",
  'email-subject': "Evaluate whether you would open this email based on the subject line.",
  survey: "Consider whether you would participate and provide thoughtful feedback.",
  product: "Evaluate product-market fit, innovation, and business potential."
};

// Get optimal model based on persona complexity
function getOptimalModel(persona: IPersona): string {
  // Use smarter models for complex personas
  if (persona.professional.seniority === 'C-Level' || 
      persona.professional.seniority === 'VP Level') {
    return 'gpt-4-turbo-preview'; // Better for executive thinking
  } else if (persona.psychographics.techAdoption < 5) {
    return 'gpt-3.5-turbo'; // Simple model for basic users
  } else if (persona.psychographics.influenceScore > 7) {
    return 'claude-3-haiku-20240307'; // Balanced for influencers
  } else {
    return 'gpt-3.5-turbo'; // Default balanced model
  }
}

function buildPersonaContext(persona: IPersona, platform: string): string {
  return `You are ${persona.name}, a ${persona.title} from ${persona.location.city}, ${persona.location.country}.

Professional Background:
- Seniority: ${persona.professional.seniority}
- Industry: ${persona.professional.primaryIndustry}
- Company Size: ${persona.professional.companySize} employees
- Experience: ${persona.professional.yearsExperience} years

Demographics:
- Generation: ${persona.demographics.generation}
- Age Range: ${persona.demographics.ageRange}

Psychographics:
- Tech Adoption: ${persona.psychographics.techAdoption}/10
- Risk Tolerance: ${persona.psychographics.riskTolerance}/10
- Price Sensitivity: ${persona.psychographics.priceSensitivity}/10
- Brand Loyalty: ${persona.psychographics.brandLoyalty}/10

Interests: ${persona.interests.join(', ')}

Personality Traits:
- Openness: ${(persona.personality.openness * 100).toFixed(0)}%
- Conscientiousness: ${(persona.personality.conscientiousness * 100).toFixed(0)}%
- Extraversion: ${(persona.personality.extraversion * 100).toFixed(0)}%

Platform Context:
You are evaluating ${PLATFORM_CONTEXTS[platform] || 'content'}.
${PLATFORM_BEHAVIORS[platform] || 'Evaluate based on your professional judgment.'}

Based on these characteristics, evaluate the content from your unique perspective.`;
}

export async function generatePersonaOpinion(
  persona: IPersona,
  postContent: string,
  postAnalysis: PostAnalysis,
  platform: string = 'product'
): Promise<PersonaOpinion> {
  try {
    const model = getOptimalModel(persona);
    const apiKey = process.env.OPENAI_API_KEY || process.env.MARTIAN_API_KEY;
    
    // If we have an API key, use real API
    if (apiKey && apiKey !== 'your-openai-api-key' && apiKey !== 'your-martian-api-key') {
      const response = await generateWithAPI(
        persona,
        postContent,
        postAnalysis,
        platform,
        model,
        apiKey
      );
      return response;
    }
    
    // Otherwise use enhanced simulation
    const response = await enhancedSimulation(
      persona,
      postContent,
      postAnalysis,
      platform
    );
    
    return response;
  } catch (error) {
    console.error(`Error generating opinion for persona ${persona.personaId}:`, error);
    // Return a default opinion on error
    return {
      attention: 'partial',
      reason: 'Unable to fully evaluate at this time',
      sentiment: 0.5
    };
  }
}

// Real API call to OpenAI/Martian
async function generateWithAPI(
  persona: IPersona,
  postContent: string,
  postAnalysis: PostAnalysis,
  platform: string,
  model: string,
  apiKey: string
): Promise<PersonaOpinion> {
  const systemPrompt = buildPersonaContext(persona, platform);
  
  const userPrompt = `Evaluate this ${platform} content:

"${postContent}"

Product/Content Analysis:
- Category: ${postAnalysis.category}
- Target Audience: ${postAnalysis.targetAudience.join(', ')}
- Value Props: ${postAnalysis.valueProps.join(', ')}
- Tone: ${postAnalysis.tone}

Based on your persona characteristics and the platform context, respond with:
1. Attention Level: "full" (very interested), "partial" (somewhat interested), or "ignore" (not interested)
2. Reason: One sentence explaining your attention level based on your background
3. Comment: If attention is "full", provide a realistic comment you might leave (platform-appropriate)
4. Sentiment: A score from 0 to 1 (0 = very negative, 0.5 = neutral, 1 = very positive)

Respond in JSON format:
{
  "attention": "full|partial|ignore",
  "reason": "Your reason here",
  "comment": "Your comment here (optional)",
  "sentiment": 0.0-1.0
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model.includes('gpt') ? model : 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;
      console.log('Raw API response content:', content);
      
      try {
        // Clean the content - sometimes AI returns markdown code blocks
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '');
        }
        
        const parsed = JSON.parse(cleanContent);
        
        // Validate the parsed response has required fields
        if (!parsed.attention || !parsed.reason) {
          throw new Error('Missing required fields in API response');
        }
        
        return {
          attention: parsed.attention as 'full' | 'partial' | 'ignore',
          reason: parsed.reason,
          comment: parsed.comment,
          sentiment: parseFloat(parsed.sentiment) || 0.5
        };
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        console.error('Raw content that failed to parse:', content);
        // Fall back to enhanced simulation
        return enhancedSimulation(persona, postContent, postAnalysis, platform);
      }
    }
  } catch (error) {
    console.error('API call failed:', error);
  }
  
  // Fall back to enhanced simulation
  return enhancedSimulation(persona, postContent, postAnalysis, platform);
}

// Enhanced simulation with platform awareness
async function enhancedSimulation(
  persona: IPersona,
  postContent: string,
  postAnalysis: PostAnalysis,
  platform: string
): Promise<PersonaOpinion> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // CRITICAL: First check if content is appropriate for the platform
  const contentLower = postContent.toLowerCase();
  const isPersonalAnnouncement = 
    contentLower.includes('gay') || 
    contentLower.includes('pregnant') || 
    contentLower.includes('married') || 
    contentLower.includes('divorced') || 
    contentLower.includes('personal') ||
    contentLower.includes('love') ||
    contentLower.includes('hate');
  
  const isInappropriate = 
    contentLower.includes('gay') && platform === 'linkedin' ||
    (isPersonalAnnouncement && platform === 'linkedin');
  
  // If content is personal/inappropriate for platform, generate appropriate response
  if (isInappropriate || isPersonalAnnouncement) {
    // Use persona characteristics to determine response
    const engagementScore = persona.personality.agreeableness * 0.3 + 
                           persona.personality.openness * 0.2 +
                           (Math.random() * 0.5); // Add randomness
    
    let attention: 'full' | 'partial' | 'ignore';
    if (engagementScore > 0.8) {
      attention = 'full';
    } else if (engagementScore > 0.4) {
      attention = 'partial';
    } else {
      attention = 'ignore';
    }
    
    // Calculate varied sentiment
    const sentiment = calculateSentiment(attention, persona, postAnalysis);
    
    // Use the enhanced generateUniqueReason for varied reasons
    const reason = generateUniqueReason(persona, platform, attention, postAnalysis.category);
    
    // Generate varied comments only for full attention
    let comment: string | undefined;
    if (attention === 'full') {
      const supportiveComments = [
        'Thanks for sharing this with us!',
        'Appreciate your openness.',
        'Brave of you to share.',
        'Wishing you all the best!',
        'Thank you for your authenticity.',
        'Respect your courage here.',
        'Your honesty is appreciated.',
        'Supporting you!',
        'Thanks for being real.',
        'Glad you felt comfortable sharing.',
        'Appreciate you letting us know.',
        'Thanks for the personal update.',
        'Your vulnerability is admirable.',
        'Sending positive thoughts.'
      ];
      const seed = persona.personaId + persona.professional.yearsExperience;
      comment = supportiveComments[(seed + Math.floor(Math.random() * 3)) % supportiveComments.length];
    }
    
    return {
      attention,
      reason,
      comment,
      sentiment: parseFloat(sentiment.toFixed(2))
    };
  }
  
  // Calculate attention based on persona characteristics and platform
  let attentionScore = 0;
  let reasons = [];
  let platformFit = 1.0;
  
  // Platform-specific engagement adjustments
  switch (platform) {
    case 'linkedin':
      if (persona.professional.seniority.includes('Level') || 
          persona.professional.seniority.includes('Director')) {
        platformFit = 1.3;
        reasons.push('Active LinkedIn user as a senior professional');
      }
      if (persona.demographics.generation === 'Gen Z') {
        platformFit *= 0.8;
      }
      break;
      
    case 'instagram':
    case 'tiktok':
      if (persona.demographics.generation === 'Gen Z' || 
          persona.demographics.generation === 'Millennial') {
        platformFit = 1.4;
        reasons.push(`${platform} aligns with my generation`);
      }
      if (persona.professional.seniority.includes('C-Level')) {
        platformFit *= 0.6;
      }
      break;
      
    case 'twitter':
      if (persona.psychographics.techAdoption >= 7) {
        platformFit = 1.2;
        reasons.push('Active on Twitter for tech news');
      }
      break;
      
    case 'email':
    case 'email-subject':
      if (persona.professional.seniority.includes('Director') ||
          persona.professional.seniority.includes('Manager')) {
        platformFit = 1.1;
        reasons.push('Regularly check professional emails');
      }
      break;
  }
  
  // Check relevance to industry
  const industryRelevance = calculateIndustryRelevance(
    postAnalysis,
    persona,
    postContent
  );
  attentionScore += industryRelevance.score * platformFit;
  if (industryRelevance.reason) reasons.push(industryRelevance.reason);
  
  // Check for startup/entrepreneurship content
  const postContentLower = postContent.toLowerCase();
  if (postContentLower.includes('starting a company') || postContentLower.includes('startup') || 
      postContentLower.includes('founder') || postContentLower.includes('entrepreneur')) {
    if (persona.professional.seniority.includes('Founder') || 
        persona.professional.seniority.includes('C-Level') ||
        persona.title.toLowerCase().includes('founder') ||
        persona.title.toLowerCase().includes('entrepreneur')) {
      attentionScore += 3 * platformFit;
      reasons.push('Fellow entrepreneur - interested in your journey');
    } else if (persona.professional.seniority.includes('Director') || 
               persona.professional.seniority.includes('VP')) {
      attentionScore += 2 * platformFit;
      reasons.push('Interested in innovative business solutions');
    }
  }
  
  // Check tech adoption alignment
  if (postAnalysis.category.toLowerCase().includes('tech') || 
      postAnalysis.category.toLowerCase().includes('software') ||
      postAnalysis.category.toLowerCase().includes('ai') ||
      postAnalysis.category.toLowerCase().includes('hr software') ||
      postAnalysis.category.toLowerCase().includes('performance management')) {
    if (persona.psychographics.techAdoption >= 7) {
      attentionScore += 2 * platformFit;
      reasons.push('Strong interest in technology');
    } else if (persona.psychographics.techAdoption < 4) {
      attentionScore -= 1;
      reasons.push('Not comfortable with new technology');
    }
  }
  
  // Generation-based content preferences
  const generationFit = calculateGenerationFit(persona, postAnalysis, platform);
  attentionScore += generationFit.score * platformFit;
  if (generationFit.reason) reasons.push(generationFit.reason);
  
  // Price sensitivity check
  if (persona.psychographics.priceSensitivity >= 7) {
    const hasPriceValue = postAnalysis.valueProps.some(v => 
      v.toLowerCase().includes('cost') || 
      v.toLowerCase().includes('free') || 
      v.toLowerCase().includes('save') ||
      v.toLowerCase().includes('affordable')
    );
    if (hasPriceValue) {
      attentionScore += 2;
      reasons.push('Appreciate the cost benefits');
    }
  }
  
  // Determine attention level
  let attention: 'full' | 'partial' | 'ignore';
  if (attentionScore >= 5) {
    attention = 'full';
  } else if (attentionScore >= 2) {
    attention = 'partial';
  } else {
    attention = 'ignore';
  }
  
  // Calculate sentiment first
  const sentiment = calculateSentiment(attention, persona, postAnalysis);
  
  // Generate unique reason based on persona characteristics
  const reason = generateUniqueReason(persona, platform, attention, postAnalysis.category);
  
  // Generate unique comment based on persona - but check content relevance first
  let comment: string | undefined;
  
  // Generate comments for full attention with more variety
  if (attention === 'full') {
    // Check if this is business/product content
    const postContentLower = postContent.toLowerCase();
    const isBusinessContent = 
      postContentLower.includes('launch') || 
      postContentLower.includes('product') || 
      postContentLower.includes('platform') ||
      postContentLower.includes('solution') ||
      postContentLower.includes('analytics') ||
      postContentLower.includes('software') ||
      postContentLower.includes('business') ||
      postContentLower.includes('startup') ||
      postContentLower.includes('saas');
    
    if (isBusinessContent) {
      // Generate detailed business comments
      comment = generateUniqueComment(
        { persona, platform, postCategory: postAnalysis.category, valueProps: postAnalysis.valueProps },
        attention,
        sentiment
      );
    } else {
      // For non-business content, generate varied acknowledgments
      const generalComments = [
        'Thanks for sharing this.',
        'Interesting perspective.',
        'Appreciate you posting this.',
        'Good to know!',
        'Thanks for the update.',
        'Noted, thank you.',
        'Interesting share.',
        'Thanks for letting us know.',
        'Appreciate the insight.',
        'Good point!',
        'Worth considering.',
        'Thanks for bringing this up.',
        'Valuable share.',
        'Appreciate the thoughts.'
      ];
      const seed = persona.personaId + persona.professional.yearsExperience;
      comment = generalComments[(seed + Math.floor(Math.random() * 3)) % generalComments.length];
    }
  }
  
  return {
    attention,
    reason,
    comment,
    sentiment: parseFloat(sentiment.toFixed(2))
  };
}

function calculateIndustryRelevance(
  postAnalysis: PostAnalysis,
  persona: IPersona,
  postContent: string
): { score: number; reason?: string } {
  const industry = persona.professional.primaryIndustry.toLowerCase();
  const category = postAnalysis.category.toLowerCase();
  const content = postContent.toLowerCase();
  const title = persona.title.toLowerCase();
  const seniority = persona.professional.seniority.toLowerCase();
  
  // Check for HR/Performance management content - HIGHLY relevant to managers and HR
  if (content.includes('employee performance') || content.includes('performance metric') || 
      content.includes('employee monitoring') || content.includes('hr') || 
      content.includes('workforce analytics') || content.includes('talent management')) {
    
    // Extremely relevant for HR professionals
    if (title.includes('hr') || title.includes('human resource') || 
        industry.includes('human resource') || title.includes('people')) {
      return { 
        score: 5, 
        reason: `Critical tool for HR professionals like myself` 
      };
    }
    
    // Very relevant for managers and executives
    if (seniority.includes('manager') || seniority.includes('director') || 
        seniority.includes('vp') || seniority.includes('level')) {
      return { 
        score: 4, 
        reason: `Essential for managing my team effectively` 
      };
    }
    
    // Relevant for larger companies
    if (persona.professional.companySize.includes('1000') || 
        persona.professional.companySize.includes('5000') ||
        persona.professional.companySize.includes('500')) {
      return { 
        score: 3, 
        reason: `Valuable for our ${persona.professional.companySize} company` 
      };
    }
  }
  
  // Check for business/enterprise software
  if (content.includes('saas') || content.includes('b2b') || content.includes('enterprise') ||
      content.includes('business software') || content.includes('platform')) {
    if (seniority.includes('level') || seniority.includes('director') || 
        seniority.includes('manager')) {
      return { 
        score: 3, 
        reason: `Evaluating enterprise solutions for our organization` 
      };
    }
  }
  
  // Direct industry match
  if (category.includes(industry) || industry.includes('software')) {
    return { 
      score: 3, 
      reason: `Directly relevant to ${persona.professional.primaryIndustry}` 
    };
  }
  
  // Check for industry keywords
  const industryKeywords: Record<string, string[]> = {
    'fintech': ['payment', 'banking', 'finance', 'money', 'transaction'],
    'healthcare': ['health', 'medical', 'patient', 'care', 'wellness'],
    'education': ['learning', 'student', 'course', 'teach', 'training'],
    'retail': ['shop', 'store', 'commerce', 'customer', 'product'],
    'marketing': ['campaign', 'brand', 'audience', 'content', 'social'],
    'operations': ['efficiency', 'productivity', 'workflow', 'process', 'optimize']
  };
  
  for (const [ind, keywords] of Object.entries(industryKeywords)) {
    if (industry.includes(ind) || title.includes(ind)) {
      const hasKeyword = keywords.some(kw => content.includes(kw));
      if (hasKeyword) {
        return { 
          score: 2, 
          reason: `Related to ${persona.professional.primaryIndustry} challenges` 
        };
      }
    }
  }
  
  return { score: 0 };
}

function calculateGenerationFit(
  persona: IPersona,
  postAnalysis: PostAnalysis,
  platform: string
): { score: number; reason?: string } {
  const generation = persona.demographics.generation;
  const tone = postAnalysis.tone.toLowerCase();
  
  if (generation === 'Gen Z') {
    if (tone.includes('casual') || tone.includes('fun') || platform === 'tiktok') {
      return { score: 2, reason: 'Resonates with my generation\'s style' };
    }
    if (tone.includes('formal') || tone.includes('corporate')) {
      return { score: -1, reason: 'Too formal for my taste' };
    }
  }
  
  if (generation === 'Boomer' || generation === 'Gen X') {
    if (tone.includes('professional') || tone.includes('formal')) {
      return { score: 1, reason: 'Appreciate the professional approach' };
    }
    if (platform === 'tiktok' || tone.includes('meme')) {
      return { score: -1, reason: 'Not my preferred communication style' };
    }
  }
  
  return { score: 0 };
}

// Removed - now using generateUniqueReason from persona-comments.ts

// Removed - now using generateUniqueComment from persona-comments.ts

function calculateSentiment(
  attention: string,
  persona: IPersona,
  postAnalysis: PostAnalysis
): number {
  // More varied base sentiment with randomness
  const randomVariance = (Math.random() - 0.5) * 0.15; // ±0.075 variance
  let baseSentiment = attention === 'full' ? 0.75 + randomVariance : 
                      attention === 'partial' ? 0.5 + randomVariance : 
                      0.3 + randomVariance;
  
  // Adjust based on personality traits
  baseSentiment += (persona.personality.openness - 0.5) * 0.15;
  baseSentiment += (persona.personality.agreeableness - 0.5) * 0.1;
  baseSentiment += (persona.personality.conscientiousness - 0.5) * 0.05;
  
  // Adjust based on psychographics
  if (persona.psychographics.techAdoption > 7 && postAnalysis.category.toLowerCase().includes('tech')) {
    baseSentiment += 0.1;
  }
  if (persona.psychographics.riskTolerance > 7 && attention === 'full') {
    baseSentiment += 0.05;
  }
  
  // Adjust based on tone match
  if (postAnalysis.tone === 'professional' && 
      persona.professional.seniority.includes('Level')) {
    baseSentiment += 0.1;
  } else if (postAnalysis.tone === 'casual' && 
             (persona.demographics.generation === 'Gen Z' || persona.demographics.generation === 'Millennial')) {
    baseSentiment += 0.08;
  }
  
  // Add some noise based on persona ID for variety
  const personaNoise = ((persona.personaId % 10) - 5) * 0.02;
  baseSentiment += personaNoise;
  
  // Keep within bounds but allow more range
  return Math.max(0.15, Math.min(0.92, baseSentiment));
}

// Cost calculation for different models
export function calculateModelCost(model: string, tokens: number): number {
  const costPer1kTokens: Record<string, number> = {
    'gpt-4-turbo-preview': 0.01,
    'gpt-3.5-turbo': 0.0005,
    'claude-3-haiku-20240307': 0.00025,
    'claude-3-sonnet': 0.003,
    'llama-3.1-8b': 0.00006,
    'mixtral-8x7b': 0.00024,
    'cerebras': 0.00001
  };
  
  const rate = costPer1kTokens[model] || 0.0001;
  return (tokens / 1000) * rate;
}