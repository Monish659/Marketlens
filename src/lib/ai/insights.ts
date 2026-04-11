// Insights Generation Module
import { IPersona } from '@/models/Persona';
import { IReaction } from '@/models/Simulation';
import { PostAnalysis, generateFinalInsights } from './cohere';

interface DemographicBreakdown {
  generation: Record<string, { total: number; engaged: number; sentiment: number }>;
  industry: Record<string, { total: number; engaged: number; sentiment: number }>;
  seniority: Record<string, { total: number; engaged: number; sentiment: number }>;
  geography: Record<string, { total: number; engaged: number; sentiment: number }>;
}

export async function generateInsights(
  reactions: IReaction[],
  personas: IPersona[],
  postAnalysis: PostAnalysis
): Promise<any> {
  try {
    // Create a map of personas for quick lookup
    const personaMap = new Map(personas.map(p => [p.personaId, p]));
    
    // Calculate demographic breakdowns
    const demographicBreakdown = calculateDemographicBreakdown(reactions, personaMap);
    
    // Calculate industry breakdown
    const industryBreakdown = calculateIndustryBreakdown(reactions, personaMap);
    
    // Get Cohere insights
    const cohereInsights = await generateFinalInsights(reactions, postAnalysis);
    
    // Combine all insights
    return {
      ...cohereInsights,
      demographicBreakdown,
      industryBreakdown,
      engagementRate: calculateEngagementRate(reactions),
      sentimentDistribution: calculateSentimentDistribution(reactions),
      geographicHotspots: findGeographicHotspots(reactions, personaMap),
      personaArchetypes: identifyTopArchetypes(reactions, personaMap)
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}

function calculateDemographicBreakdown(
  reactions: IReaction[],
  personaMap: Map<number, IPersona>
): DemographicBreakdown {
  const breakdown: DemographicBreakdown = {
    generation: {},
    industry: {},
    seniority: {},
    geography: {}
  };
  
  // Process each reaction
  reactions.forEach(reaction => {
    const persona = personaMap.get(reaction.personaId);
    if (!persona) return;
    
    // Generation breakdown
    const gen = persona.demographics.generation;
    if (!breakdown.generation[gen]) {
      breakdown.generation[gen] = { total: 0, engaged: 0, sentiment: 0 };
    }
    breakdown.generation[gen].total++;
    if (reaction.attention !== 'ignore') {
      breakdown.generation[gen].engaged++;
    }
    breakdown.generation[gen].sentiment += reaction.sentiment;
    
    // Industry breakdown
    const industry = persona.professional.primaryIndustry;
    if (!breakdown.industry[industry]) {
      breakdown.industry[industry] = { total: 0, engaged: 0, sentiment: 0 };
    }
    breakdown.industry[industry].total++;
    if (reaction.attention !== 'ignore') {
      breakdown.industry[industry].engaged++;
    }
    breakdown.industry[industry].sentiment += reaction.sentiment;
    
    // Seniority breakdown
    const seniority = persona.professional.seniority;
    if (!breakdown.seniority[seniority]) {
      breakdown.seniority[seniority] = { total: 0, engaged: 0, sentiment: 0 };
    }
    breakdown.seniority[seniority].total++;
    if (reaction.attention !== 'ignore') {
      breakdown.seniority[seniority].engaged++;
    }
    breakdown.seniority[seniority].sentiment += reaction.sentiment;
    
    // Geography breakdown
    const country = persona.location.country;
    if (!breakdown.geography[country]) {
      breakdown.geography[country] = { total: 0, engaged: 0, sentiment: 0 };
    }
    breakdown.geography[country].total++;
    if (reaction.attention !== 'ignore') {
      breakdown.geography[country].engaged++;
    }
    breakdown.geography[country].sentiment += reaction.sentiment;
  });
  
  // Calculate averages
  Object.keys(breakdown.generation).forEach(key => {
    breakdown.generation[key].sentiment /= breakdown.generation[key].total;
  });
  Object.keys(breakdown.industry).forEach(key => {
    breakdown.industry[key].sentiment /= breakdown.industry[key].total;
  });
  Object.keys(breakdown.seniority).forEach(key => {
    breakdown.seniority[key].sentiment /= breakdown.seniority[key].total;
  });
  Object.keys(breakdown.geography).forEach(key => {
    breakdown.geography[key].sentiment /= breakdown.geography[key].total;
  });
  
  return breakdown;
}

function calculateIndustryBreakdown(
  reactions: IReaction[],
  personaMap: Map<number, IPersona>
): Record<string, number> {
  const industryEngagement: Record<string, number> = {};
  
  reactions.forEach(reaction => {
    const persona = personaMap.get(reaction.personaId);
    if (!persona) return;
    
    const industry = persona.professional.primaryIndustry;
    if (!industryEngagement[industry]) {
      industryEngagement[industry] = 0;
    }
    
    if (reaction.attention === 'full') {
      industryEngagement[industry] += 2;
    } else if (reaction.attention === 'partial') {
      industryEngagement[industry] += 1;
    }
  });
  
  return industryEngagement;
}

function calculateEngagementRate(reactions: IReaction[]): number {
  const engaged = reactions.filter(r => r.attention !== 'ignore').length;
  return (engaged / reactions.length) * 100;
}

function calculateSentimentDistribution(reactions: IReaction[]): {
  positive: number;
  neutral: number;
  negative: number;
} {
  const positive = reactions.filter(r => r.sentiment > 0.6).length;
  const negative = reactions.filter(r => r.sentiment < 0.4).length;
  const neutral = reactions.length - positive - negative;
  
  return {
    positive: (positive / reactions.length) * 100,
    neutral: (neutral / reactions.length) * 100,
    negative: (negative / reactions.length) * 100
  };
}

function findGeographicHotspots(
  reactions: IReaction[],
  personaMap: Map<number, IPersona>
): string[] {
  const cityEngagement: Record<string, { total: number; engaged: number }> = {};
  
  reactions.forEach(reaction => {
    const persona = personaMap.get(reaction.personaId);
    if (!persona) return;
    
    const city = `${persona.location.city}, ${persona.location.country}`;
    if (!cityEngagement[city]) {
      cityEngagement[city] = { total: 0, engaged: 0 };
    }
    
    cityEngagement[city].total++;
    if (reaction.attention !== 'ignore') {
      cityEngagement[city].engaged++;
    }
  });
  
  // Find cities with high engagement rates
  const hotspots = Object.entries(cityEngagement)
    .filter(([_, stats]) => stats.total >= 2) // At least 2 personas
    .map(([city, stats]) => ({
      city,
      engagementRate: stats.engaged / stats.total
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5)
    .map(item => item.city);
  
  return hotspots;
}

function identifyTopArchetypes(
  reactions: IReaction[],
  personaMap: Map<number, IPersona>
): string[] {
  const archetypes: string[] = [];
  
  // Find highly engaged personas
  const engagedReactions = reactions.filter(r => r.attention === 'full');
  
  // Group by common characteristics
  const seniorTech = engagedReactions.filter(r => {
    const p = personaMap.get(r.personaId);
    return p && p.professional.seniority.includes('Level') && p.psychographics.techAdoption >= 7;
  });
  
  const youngEntrepreneurs = engagedReactions.filter(r => {
    const p = personaMap.get(r.personaId);
    return p && (p.demographics.generation === 'Gen Z' || p.demographics.generation === 'Millennial') &&
           p.psychographics.riskTolerance >= 7;
  });
  
  const enterpriseDecisionMakers = engagedReactions.filter(r => {
    const p = personaMap.get(r.personaId);
    return p && p.professional.companySize === '5000+' && 
           (p.professional.seniority.includes('Director') || p.professional.seniority.includes('VP'));
  });
  
  if (seniorTech.length > 3) archetypes.push('Senior Tech Leaders');
  if (youngEntrepreneurs.length > 3) archetypes.push('Young Entrepreneurs');
  if (enterpriseDecisionMakers.length > 3) archetypes.push('Enterprise Decision Makers');
  
  return archetypes;
}
