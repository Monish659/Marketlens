import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log(' [EXTRACT-NICHE] API endpoint called');
  
  try {
    const body = await request.json();
    console.log(' [EXTRACT-NICHE] Request body:', body);
    
    const { idea } = body;

    if (!idea || typeof idea !== 'string') {
      console.error(' [EXTRACT-NICHE] Invalid idea provided:', { idea, type: typeof idea });
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
    }

    console.log(' [EXTRACT-NICHE] Processing idea:', idea.substring(0, 100) + '...');
    
    // Extract niche/industry from the idea using simple keyword analysis
    const niche = extractNicheFromIdea(idea);
    
    console.log(' [EXTRACT-NICHE] Successfully identified niche:', niche);

    return NextResponse.json({ 
      success: true, 
      niche,
      message: `Identified niche: ${niche}` 
    });

  } catch (error) {
    console.error(' [EXTRACT-NICHE] Error occurred:', error);
    console.error(' [EXTRACT-NICHE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to extract niche from idea',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function extractNicheFromIdea(idea: string): string {
  console.log(' [EXTRACT-NICHE] Starting niche analysis for idea length:', idea.length);
  
  const lowerIdea = idea.toLowerCase();
  console.log(' [EXTRACT-NICHE] Lowercase idea:', lowerIdea);
  
  // Define niche patterns with keywords
  const niches = [
    {
      name: "Electric Vehicles & Automotive",
      keywords: ["electric", "ev", "car", "vehicle", "automotive", "tesla", "charging", "battery", "hybrid", "autonomous"]
    },
    {
      name: "Health & Fitness",
      keywords: ["health", "fitness", "workout", "exercise", "nutrition", "wellness", "medical", "healthcare", "diet", "gym"]
    },
    {
      name: "Financial Technology",
      keywords: ["fintech", "finance", "banking", "payment", "crypto", "blockchain", "investment", "trading", "money", "wallet"]
    },
    {
      name: "E-commerce & Retail",
      keywords: ["shop", "store", "retail", "ecommerce", "marketplace", "buy", "sell", "product", "commerce", "shopping"]
    },
    {
      name: "Education Technology",
      keywords: ["education", "learning", "school", "course", "teach", "student", "edtech", "training", "skill", "knowledge"]
    },
    {
      name: "Food & Beverage",
      keywords: ["food", "restaurant", "cooking", "recipe", "meal", "delivery", "kitchen", "dining", "beverage", "nutrition"]
    },
    {
      name: "Real Estate & Property",
      keywords: ["real estate", "property", "house", "home", "rent", "buy", "apartment", "housing", "mortgage", "landlord"]
    },
    {
      name: "Travel & Tourism",
      keywords: ["travel", "trip", "vacation", "hotel", "flight", "booking", "tourism", "destination", "adventure", "explore"]
    },
    {
      name: "Social Media & Communication",
      keywords: ["social", "chat", "message", "communication", "network", "connect", "share", "post", "community", "platform"]
    },
    {
      name: "Gaming & Entertainment",
      keywords: ["game", "gaming", "entertainment", "video", "stream", "play", "fun", "movie", "music", "content"]
    },
    {
      name: "Productivity & Business Tools",
      keywords: ["productivity", "business", "tool", "software", "app", "work", "office", "management", "organization", "efficiency"]
    },
    {
      name: "Sustainability & Environment",
      keywords: ["sustainable", "environment", "green", "eco", "climate", "renewable", "carbon", "pollution", "recycling", "clean"]
    },
    {
      name: "Fashion & Beauty",
      keywords: ["fashion", "beauty", "clothing", "style", "makeup", "skincare", "apparel", "design", "trend", "cosmetics"]
    },
    {
      name: "Home & Garden",
      keywords: ["home", "garden", "house", "furniture", "decor", "interior", "outdoor", "lawn", "plant", "renovation"]
    },
    {
      name: "Pet Care & Animals",
      keywords: ["pet", "dog", "cat", "animal", "veterinary", "care", "training", "grooming", "rescue", "shelter", "adoption"]
    }
  ];

  // Score each niche based on keyword matches
  let bestMatch = { name: "General Technology", score: 0 };
  
  console.log(' [EXTRACT-NICHE] Analyzing', niches.length, 'potential niches...');
  
  // Generic keywords that should have lower weight
  const genericKeywords = ["tool", "app", "software", "business", "work", "management", "platform", "service"];
  
  for (const niche of niches) {
    let score = 0;
    const matchedKeywords: string[] = [];
    
    for (const keyword of niche.keywords) {
      if (lowerIdea.includes(keyword)) {
        // Give lower weight to generic keywords
        const keywordWeight = genericKeywords.includes(keyword) ? 0.3 : 1.0;
        score += keywordWeight;
        matchedKeywords.push(keyword);
        
        // Give extra weight to exact matches (but also consider if it's generic)
        if (lowerIdea.includes(` ${keyword} `) || lowerIdea.startsWith(keyword) || lowerIdea.endsWith(keyword)) {
          score += (0.5 * keywordWeight);
        }
        
        // Give significant bonus for domain-specific terms
        if (["dog", "cat", "pet", "animal", "rescue", "shelter"].includes(keyword)) {
          score += 2; // Strong bonus for animal-related terms
        }
      }
    }
    
    if (score > 0) {
      console.log(` [EXTRACT-NICHE] ${niche.name}: score=${score.toFixed(2)}, keywords=[${matchedKeywords.join(', ')}]`);
    }
    
    if (score > bestMatch.score) {
      bestMatch = { name: niche.name, score };
    }
  }

  console.log(' [EXTRACT-NICHE] Best match:', bestMatch);
  return bestMatch.name;
}
