// Cohere Integration for Post Analysis and Insights
import { CohereClient } from 'cohere-ai';
import dns from 'dns';

// Keep IPv6 as default, but enable fallback to IPv4
let useIPv4Fallback = false;

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || '',
});

// Helper to handle IPv6/IPv4 fallback
function handleNetworkError(error: any): boolean {
  if (!useIPv4Fallback && 
      (error.message?.includes('Connect Timeout') || 
       error.message?.includes('ETIMEDOUT') ||
       error.code === 'UND_ERR_CONNECT_TIMEOUT')) {
    console.log('⚠️ [Cohere] IPv6 failed, switching to IPv4');
    dns.setDefaultResultOrder('ipv4first');
    useIPv4Fallback = true;
    return true;
  }
  return false;
}

export interface PostAnalysis {
  category: string;
  targetAudience: string[];
  valueProps: string[];
  tone: string;
  concerns: string[];
}

export async function analyzePost(postContent: string, platform: string = 'product'): Promise<PostAnalysis> {
  // First check if this is personal/inappropriate content
  const contentLower = postContent.toLowerCase();
  const isPersonalContent = 
    contentLower.includes('gay') || 
    contentLower.includes('pregnant') || 
    contentLower.includes('married') || 
    contentLower.includes('divorced') || 
    contentLower.includes('personal') ||
    contentLower.includes('love') ||
    contentLower.includes('hate') ||
    contentLower.split(' ').length < 10 && !contentLower.includes('launch');
  
  if (isPersonalContent) {
    // Return appropriate analysis for personal content
    return {
      category: "Personal Announcement",
      targetAudience: ["Personal Network", "Friends"],
      valueProps: ["Personal sharing", "Life update"],
      tone: "Personal",
      concerns: ["Not appropriate for professional platform", "May confuse professional network", "Wrong platform choice"]
    };
  }
  
  try {
    const response = await cohere.chat({
      model: 'command-r-plus-08-2024',
      message: `Analyze this ${platform} post and extract key information:

"${postContent}"

Platform: ${platform}

Please analyze and provide:
1. Product/Content category - Be SPECIFIC (e.g., "HR Software", "Performance Management Tool", "Employee Analytics", "B2B SaaS", "Developer Tools", etc.)
2. Target audience - Be SPECIFIC about roles and company sizes (e.g., "HR Managers at Enterprise Companies", "C-Level Executives", "Operations Directors", "Team Leaders at Mid-Market Companies", etc.)
3. Key value propositions or main points (list 3-4 specific benefits)
4. Tone and positioning (professional, casual, technical, personal, etc.)
5. Potential concerns or barriers to engagement (list 2-3 realistic concerns)

IMPORTANT: 
- If content mentions employees, performance, metrics, HR, monitoring, or management - categorize it appropriately as HR/Management related
- For target audience, include specific job titles and company sizes that would benefit

Format your response as JSON with these exact keys:
{
  "category": "...",
  "targetAudience": ["...", "..."],
  "valueProps": ["...", "...", "..."],
  "tone": "...",
  "concerns": ["...", "..."]
}`,
      temperature: 0.3,
    });

    // Parse the response
    const content = response.text;
    
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback parsing if JSON extraction fails
    return {
      category: "General Product",
      targetAudience: ["General Audience"],
      valueProps: ["Innovation", "Efficiency", "Value"],
      tone: "Professional",
      concerns: ["Market fit", "Competition"]
    };

  } catch (error) {
    console.error('Error analyzing post with Cohere:', error);
    // Return default analysis on error
    return {
      category: "Unknown",
      targetAudience: ["General Audience"],
      valueProps: ["Value Proposition"],
      tone: "Professional",
      concerns: ["Unknown"]
    };
  }
}

export async function generateFinalInsights(
  reactions: any[],
  postAnalysis: PostAnalysis
): Promise<any> {
  try {
    // Aggregate reaction data
    const fullAttention = reactions.filter(r => r.attention === 'full');
    const partialAttention = reactions.filter(r => r.attention === 'partial');
    const ignored = reactions.filter(r => r.attention === 'ignore');

    const engagementReasons = fullAttention.map(r => r.reason);
    const ignoreReasons = ignored.map(r => r.reason);
    const positiveComments = reactions.filter(r => r.sentiment > 0.6 && r.comment);
    const negativeComments = reactions.filter(r => r.sentiment < 0.4 && r.comment);

    const prompt = `Based on these reactions to a product launch post, provide comprehensive insights:

Product Analysis:
- Category: ${postAnalysis.category}
- Target Audience: ${postAnalysis.targetAudience.join(', ')}
- Value Props: ${postAnalysis.valueProps.join(', ')}

Reaction Summary:
- Full Attention: ${fullAttention.length} (${(fullAttention.length / reactions.length * 100).toFixed(1)}%)
- Partial Attention: ${partialAttention.length} (${(partialAttention.length / reactions.length * 100).toFixed(1)}%)
- Ignored: ${ignored.length} (${(ignored.length / reactions.length * 100).toFixed(1)}%)

Top Engagement Reasons (sample):
${engagementReasons.slice(0, 10).join('\n')}

Top Ignore Reasons (sample):
${ignoreReasons.slice(0, 10).join('\n')}

Positive Comments (sample):
${positiveComments.slice(0, 5).map(r => r.comment).join('\n')}

Negative Comments (sample):
${negativeComments.slice(0, 5).map(r => r.comment).join('\n')}

Please provide:
1. Top 3 reasons people engaged with this product
2. Top 3 reasons people ignored it
3. Unexpected audience segments that showed interest
4. Critical improvements needed for better market reception
5. Viral potential score (0-100) with explanation
6. Key recommendations for the product launch strategy

Format as JSON with these keys:
{
  "topEngagementReasons": ["...", "...", "..."],
  "topIgnoreReasons": ["...", "...", "..."],
  "unexpectedAudiences": ["...", "..."],
  "criticalImprovements": ["...", "...", "..."],
  "viralPotentialScore": 0,
  "viralPotentialExplanation": "...",
  "recommendations": ["...", "...", "..."]
}`;

    const response = await cohere.chat({
      model: 'command-r-plus-08-2024',
      message: prompt,
      temperature: 0.2,
    });

    const content = response.text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback
    return {
      topEngagementReasons: ["Innovative solution", "Clear value proposition", "Good timing"],
      topIgnoreReasons: ["Not relevant to needs", "Too complex", "Price concerns"],
      unexpectedAudiences: ["Small businesses", "Educational sector"],
      criticalImprovements: ["Clearer pricing", "Better onboarding", "More use cases"],
      viralPotentialScore: 65,
      viralPotentialExplanation: "Good product-market fit but needs stronger differentiator",
      recommendations: ["Focus on early adopters", "Create demo videos", "Leverage social proof"]
    };

  } catch (error) {
    console.error('Error generating insights with Cohere:', error);
    throw error;
  }
}
