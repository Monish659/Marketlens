import { NextRequest, NextResponse } from 'next/server';
import { createBulkAuth0Users, Auth0UserProfile } from '@/lib/auth0-management';

export async function POST(request: NextRequest) {
  console.log('👥 [GENERATE-PROFILES] API endpoint called');
  
  try {
    const body = await request.json();
    console.log('📥 [GENERATE-PROFILES] Request body:', body);
    
    const { niche } = body;

    if (!niche || typeof niche !== 'string') {
      console.error('❌ [GENERATE-PROFILES] Invalid niche provided:', { niche, type: typeof niche });
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
    }

    console.log('🎯 [GENERATE-PROFILES] Generating profiles for niche:', niche);
    
    // Generate 50 diverse user profiles based on the niche
    const profiles = generateProfilesForNiche(niche);
    
    console.log(`✅ [GENERATE-PROFILES] Generated ${profiles.length} profiles for niche: ${niche}`);
    const userTypeStats = profiles.reduce((acc: any, p) => {
      acc[p.user_type] = (acc[p.user_type] || 0) + 1;
      return acc;
    }, {});
    const countryStats = profiles.reduce((acc: any, p) => {
      acc[p.country] = (acc[p.country] || 0) + 1;
      return acc;
    }, {});
    console.log(`📊 [GENERATE-PROFILES] User types: Early adopters: ${userTypeStats.earlyAdopter}, Mainstream: ${userTypeStats.mainstream}, Skeptics: ${userTypeStats.skeptic}`);
    console.log(`🌍 [GENERATE-PROFILES] Countries: ${Object.entries(countryStats).map(([country, count]) => `${country}: ${count}`).join(', ')}`);

    // Create Auth0 users from the generated profiles
    console.log('🔐 [GENERATE-PROFILES] Creating Auth0 users...');
    try {
      const auth0Profiles: Auth0UserProfile[] = profiles.map(profile => ({
        email: profile.email,
        name: profile.name,
        user_metadata: {
          // Complete profile data matching your schema
          personaId: profile.personaId,
          title: profile.title,
          location: profile.location,
          demographics: profile.demographics,
          professional: profile.professional,
          psychographics: profile.psychographics,
          interests: profile.interests,
          personality: profile.personality,
          dataSources: profile.dataSources,
          // Legacy fields for compatibility
          country: profile.country,
          age: profile.age,
          occupation: profile.occupation,
          lifestyle: profile.lifestyle,
          niche_likes: profile.likes_about_niche,
          niche_dislikes: profile.dislikes_about_niche,
          use_cases: profile.use_cases,
          purchase_intent: profile.purchase_intent,
          user_type: profile.user_type
        },
        app_metadata: {
          is_fake_profile: true,
          niche: niche,
          created_for_simulation: true,
          simulation_timestamp: new Date().toISOString()
        },
        email_verified: false,
        blocked: false
      }));

      const auth0Results = await createBulkAuth0Users(auth0Profiles);
      
      console.log(`✅ [GENERATE-PROFILES] Auth0 user creation complete - Success: ${auth0Results.success.length}, Failed: ${auth0Results.failed.length}`);
      
      if (auth0Results.failed.length > 0) {
        console.warn('⚠️ [GENERATE-PROFILES] Some Auth0 users failed to create:', auth0Results.failed);
      }

      return NextResponse.json({ 
        success: true, 
        profiles,
        auth0Results,
        stats: {
          total: profiles.length,
          userTypes: userTypeStats,
          countries: countryStats,
          auth0_created: auth0Results.success.length,
          auth0_failed: auth0Results.failed.length
        }
      });

    } catch (auth0Error) {
      console.error('💥 [GENERATE-PROFILES] Auth0 integration failed:', auth0Error);
      
      // Return profiles even if Auth0 creation fails
      return NextResponse.json({ 
        success: true, 
        profiles,
        auth0Error: auth0Error instanceof Error ? auth0Error.message : 'Auth0 integration failed',
        stats: {
          total: profiles.length,
          userTypes: userTypeStats,
          countries: countryStats,
          auth0_created: 0,
          auth0_failed: profiles.length
        }
      });
    }

  } catch (error) {
    console.error('💥 [GENERATE-PROFILES] Error occurred:', error);
    console.error('💥 [GENERATE-PROFILES] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to generate user profiles',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateProfilesForNiche(niche: string): any[] {
  console.log('🏭 [GENERATE-PROFILES] Starting profile generation for niche:', niche);
  
  const profiles = [];
  
  // Base data for generating diverse profiles with coordinates
  const locations = [
    { city: "New York", country: "United States", coordinates: [-74.0059, 40.7128] },
    { city: "Los Angeles", country: "United States", coordinates: [-118.2437, 34.0522] },
    { city: "San Francisco", country: "United States", coordinates: [-122.4194, 37.7749] },
    { city: "Chicago", country: "United States", coordinates: [-87.6298, 41.8781] },
    { city: "Toronto", country: "Canada", coordinates: [-79.3832, 43.6532] },
    { city: "Vancouver", country: "Canada", coordinates: [-123.1207, 49.2827] },
    { city: "London", country: "United Kingdom", coordinates: [-0.1276, 51.5074] },
    { city: "Berlin", country: "Germany", coordinates: [13.4050, 52.5200] },
    { city: "Paris", country: "France", coordinates: [2.3522, 48.8566] },
    { city: "Sydney", country: "Australia", coordinates: [151.2093, -33.8688] },
    { city: "Melbourne", country: "Australia", coordinates: [144.9631, -37.8136] },
    { city: "Tokyo", country: "Japan", coordinates: [139.6917, 35.6895] },
    { city: "Seoul", country: "South Korea", coordinates: [126.9780, 37.5665] },
    { city: "Singapore", country: "Singapore", coordinates: [103.8198, 1.3521] },
    { city: "Amsterdam", country: "Netherlands", coordinates: [4.9041, 52.3676] },
    { city: "Stockholm", country: "Sweden", coordinates: [18.0686, 59.3293] },
    { city: "Oslo", country: "Norway", coordinates: [10.7522, 59.9139] },
    { city: "Copenhagen", country: "Denmark", coordinates: [12.5683, 55.6761] },
    { city: "Zurich", country: "Switzerland", coordinates: [8.5417, 47.3769] },
    { city: "Vienna", country: "Austria", coordinates: [16.3738, 48.2082] },
    { city: "Auckland", country: "New Zealand", coordinates: [174.7633, -36.8485] },
    { city: "Dublin", country: "Ireland", coordinates: [-6.2603, 53.3498] },
    { city: "Brussels", country: "Belgium", coordinates: [4.3517, 50.8503] },
    { city: "Helsinki", country: "Finland", coordinates: [24.9384, 60.1699] },
    { city: "Rome", country: "Italy", coordinates: [12.4964, 41.9028] },
    { city: "Madrid", country: "Spain", coordinates: [-3.7038, 40.4168] },
    { city: "Lisbon", country: "Portugal", coordinates: [-9.1393, 38.7223] }
  ];

  const firstNames = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Sage", "River",
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William",
    "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander",
    "Abigail", "Michael", "Emily", "Daniel", "Elizabeth", "Matthew", "Sofia", "Jackson", "Avery", "Sebastian",
    "Ella", "David", "Madison", "Carter", "Scarlett", "Wyatt", "Victoria", "Jayden", "Aria", "John"
  ];

  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
  ];

  console.log('📋 [GENERATE-PROFILES] Base data loaded - Locations:', locations.length, 'Names:', firstNames.length + lastNames.length);

  // Generate niche-specific profile templates
  const nicheProfiles = getNicheSpecificProfiles(niche);
  console.log('🎨 [GENERATE-PROFILES] Generated', nicheProfiles.length, 'niche-specific templates');
  
  for (let i = 0; i < 50; i++) {
    const template = nicheProfiles[i % nicheProfiles.length];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    // Generate additional profile data matching your schema
    const genders = ["Male", "Female", "Non-binary"];
    const generations = ["Gen Z", "Millennial", "Gen X", "Baby Boomer"];
    const seniorities = ["Entry Level", "Mid Level", "Senior Level", "Executive Level"];
    const industries = ["Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail", "Consulting"];
    const companySizes = ["1-10", "11-50", "51-200", "201-1000", "1000-5000", "5000+"];
    
    // Generate unique random integer to prevent duplicate users
    const randomInt = Math.floor(Math.random() * 1000000);
    
    const profile = {
      personaId: Date.now() + i,
      name: `${firstName} ${lastName}`,
      title: template.occupations[Math.floor(Math.random() * template.occupations.length)],
      location: {
        city: location.city,
        country: location.country,
        coordinates: {
          type: "Point",
          coordinates: location.coordinates
        }
      },
      demographics: {
        generation: generations[Math.floor(Math.random() * generations.length)],
        gender: genders[Math.floor(Math.random() * genders.length)],
        ageRange: `${template.ageRange[0]}-${template.ageRange[1]}`
      },
      professional: {
        seniority: seniorities[Math.floor(Math.random() * seniorities.length)],
        primaryIndustry: industries[Math.floor(Math.random() * industries.length)],
        secondaryIndustry: industries[Math.floor(Math.random() * industries.length)],
        companySize: companySizes[Math.floor(Math.random() * companySizes.length)],
        yearsExperience: template.ageRange[0] - 22 + Math.floor(Math.random() * 10)
      },
      psychographics: {
        techAdoption: Math.floor(Math.random() * 10) + 1,
        riskTolerance: Math.floor(Math.random() * 10) + 1,
        priceSensitivity: Math.floor(Math.random() * 10) + 1,
        influenceScore: Math.floor(Math.random() * 10) + 1,
        brandLoyalty: Math.floor(Math.random() * 10) + 1
      },
      interests: [niche, "Technology", "Innovation", "Business"],
      personality: {
        openness: Math.random(),
        conscientiousness: Math.random(),
        extraversion: Math.random(),
        agreeableness: Math.random(),
        neuroticism: Math.random()
      },
      dataSources: ["simulation", "generated"],
      // Legacy fields for compatibility
      user_id: `fake_user_${Date.now()}_${i}_${randomInt}`,
      email: `fakeuser.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomInt}@simulatedprofiles.com`,
      country: location.country,
      age: template.ageRange[0] + Math.floor(Math.random() * (template.ageRange[1] - template.ageRange[0])),
      occupation: template.occupations[Math.floor(Math.random() * template.occupations.length)],
      income_range: template.incomeRanges[Math.floor(Math.random() * template.incomeRanges.length)],
      likes_about_niche: template.likes[Math.floor(Math.random() * template.likes.length)],
      dislikes_about_niche: template.dislikes[Math.floor(Math.random() * template.dislikes.length)],
      use_cases: template.useCases[Math.floor(Math.random() * template.useCases.length)],
      purchase_intent: template.purchaseIntents[Math.floor(Math.random() * template.purchaseIntents.length)],
      lifestyle: template.lifestyles[Math.floor(Math.random() * template.lifestyles.length)],
      user_type: template.userTypes[Math.floor(Math.random() * template.userTypes.length)],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log(`👤 [GENERATE-PROFILES] Generated profile ${i + 1}/50:`, {
      name: profile.name,
      email: profile.email,
      location: `${profile.location.city}, ${profile.location.country}`,
      coordinates: profile.location.coordinates.coordinates,
      occupation: profile.occupation,
      user_type: profile.user_type,
      template: template.name
    });
    
    profiles.push(profile);
  }
  
  console.log('🎉 [GENERATE-PROFILES] Profile generation complete! Generated', profiles.length, 'profiles');
  
  // Log summary statistics
  const userTypes = profiles.reduce((acc: any, p) => {
    acc[p.user_type] = (acc[p.user_type] || 0) + 1;
    return acc;
  }, {});
  
  const location_count = profiles.reduce((acc: any, p) => {
    const locationKey = `${p.location.city}, ${p.location.country}`;
    acc[locationKey] = (acc[locationKey] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📈 [GENERATE-PROFILES] User type distribution:', userTypes);
  console.log('🌍 [GENERATE-PROFILES] Location distribution (top 5):', 
    Object.entries(location_count)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)
      .reduce((obj: any, [k, v]) => ({ ...obj, [k]: v }), {})
  );
  
  return profiles;
}

function getNicheSpecificProfiles(niche: string): any[] {
  const baseProfiles = [
    {
      name: "early_adopter",
      ageRange: [25, 40],
      occupations: ["Software Engineer", "Product Manager", "Designer", "Startup Founder", "Tech Consultant"],
      incomeRanges: ["75k-100k", "100k-150k", "150k+"],
      userTypes: ["Early adopter"],
      purchaseIntents: ["Ready to buy now", "Planning to buy within 3 months", "Actively researching"],
      lifestyles: [["Tech-savvy", "Innovation-focused"], ["Early adopter", "Risk-taker"], ["Trendsetter", "Influencer"]]
    },
    {
      name: "mainstream_user",
      ageRange: [30, 55],
      occupations: ["Teacher", "Nurse", "Accountant", "Manager", "Sales Representative"],
      incomeRanges: ["50k-75k", "75k-100k"],
      userTypes: ["Mainstream user"],
      purchaseIntents: ["Considering in next 6-12 months", "Waiting for reviews", "Price-conscious"],
      lifestyles: [["Family-oriented", "Practical"], ["Value-conscious", "Reliable"], ["Community-minded", "Traditional"]]
    },
    {
      name: "skeptic",
      ageRange: [40, 65],
      occupations: ["Engineer", "Analyst", "Researcher", "Consultant", "Executive"],
      incomeRanges: ["75k-100k", "100k-150k"],
      userTypes: ["Skeptic"],
      purchaseIntents: ["Need more convincing", "Waiting for proven track record", "Researching alternatives"],
      lifestyles: [["Analytical", "Cautious"], ["Research-oriented", "Detail-focused"], ["Risk-averse", "Traditional"]]
    }
  ];

  // Customize based on niche
  switch (niche.toLowerCase()) {
    case "electric vehicles & automotive":
      return [
        {
          ...baseProfiles[0],
          likes: [
            "Zero emissions and environmental impact",
            "Cutting-edge technology and innovation",
            "Quiet, smooth driving experience",
            "Lower operating costs over time",
            "Advanced features like autopilot"
          ],
          dislikes: [
            "Limited charging infrastructure",
            "Higher upfront purchase cost",
            "Range anxiety on long trips",
            "Charging time compared to gas fill-up",
            "Limited model variety"
          ],
          useCases: [
            ["Daily commuting", "City driving"],
            ["Weekend trips", "Road trips"],
            ["Family transportation", "School runs"],
            ["Business travel", "Client meetings"]
          ]
        },
        {
          ...baseProfiles[1],
          likes: [
            "Environmental benefits for my family",
            "Potential cost savings on fuel",
            "Modern safety features",
            "Government incentives and rebates",
            "Reduced maintenance needs"
          ],
          dislikes: [
            "Uncertainty about reliability",
            "Charging at home setup costs",
            "Limited service centers",
            "Resale value concerns",
            "Learning curve for new technology"
          ],
          useCases: [
            ["Family trips", "Daily errands"],
            ["Commuting to work", "School pickup"],
            ["Weekend activities", "Shopping"],
            ["Visiting family", "Local travel"]
          ]
        },
        {
          ...baseProfiles[2],
          likes: [
            "Theoretical environmental benefits",
            "Advanced engineering concepts",
            "Potential for energy independence",
            "Innovation in battery technology",
            "Government policy alignment"
          ],
          dislikes: [
            "Unproven long-term reliability",
            "Grid dependency and electricity source",
            "Battery replacement costs",
            "Limited charging infrastructure",
            "Performance in extreme weather"
          ],
          useCases: [
            ["Analyzing total cost of ownership", "Comparing alternatives"],
            ["Researching technology specs", "Reading reviews"],
            ["Waiting for next generation", "Monitoring market trends"],
            ["Evaluating environmental impact", "Studying policy changes"]
          ]
        }
      ];

    case "health & fitness":
      return [
        {
          ...baseProfiles[0],
          likes: [
            "Data-driven fitness tracking",
            "Personalized workout recommendations",
            "Integration with wearable devices",
            "Social features and community",
            "Gamification of fitness goals"
          ],
          dislikes: [
            "Privacy concerns with health data",
            "Subscription costs adding up",
            "Over-reliance on technology",
            "Inaccurate tracking sometimes",
            "Too many notifications"
          ],
          useCases: [
            ["Daily workout tracking", "Progress monitoring"],
            ["Nutrition logging", "Meal planning"],
            ["Social challenges", "Community engagement"],
            ["Health goal setting", "Performance analysis"]
          ]
        },
        {
          ...baseProfiles[1],
          likes: [
            "Simple, easy-to-use interface",
            "Affordable fitness solutions",
            "Family-friendly features",
            "Proven health benefits",
            "Professional guidance included"
          ],
          dislikes: [
            "Complex technology setup",
            "Hidden costs and fees",
            "Time-consuming data entry",
            "Overwhelming amount of features",
            "Lack of human interaction"
          ],
          useCases: [
            ["Basic fitness tracking", "Weight management"],
            ["Family health monitoring", "Kids' activities"],
            ["Simple workout routines", "Walking/running"],
            ["Health reminders", "Doctor visit prep"]
          ]
        },
        {
          ...baseProfiles[2],
          likes: [
            "Scientific accuracy of measurements",
            "Evidence-based recommendations",
            "Data privacy and security",
            "Professional-grade features",
            "Integration with healthcare providers"
          ],
          dislikes: [
            "Unvalidated health claims",
            "Data accuracy concerns",
            "Lack of medical oversight",
            "Privacy and security risks",
            "Over-simplified health advice"
          ],
          useCases: [
            ["Medical condition monitoring", "Doctor collaboration"],
            ["Research-based fitness planning", "Data analysis"],
            ["Comparing different solutions", "Reading studies"],
            ["Professional consultation", "Health optimization"]
          ]
        }
      ];

    default:
      // Generic technology profiles
      return [
        {
          ...baseProfiles[0],
          likes: [
            "Innovative features and capabilities",
            "Time-saving automation",
            "Modern, intuitive design",
            "Integration with existing tools",
            "Competitive advantage"
          ],
          dislikes: [
            "Learning curve for new features",
            "Potential security vulnerabilities",
            "Subscription pricing model",
            "Dependency on internet connection",
            "Frequent updates and changes"
          ],
          useCases: [
            ["Daily productivity", "Work efficiency"],
            ["Personal organization", "Task management"],
            ["Creative projects", "Innovation"],
            ["Business optimization", "Process improvement"]
          ]
        },
        {
          ...baseProfiles[1],
          likes: [
            "Solves real everyday problems",
            "Easy to learn and use",
            "Good value for money",
            "Reliable customer support",
            "Proven track record"
          ],
          dislikes: [
            "Too many complex features",
            "Unclear pricing structure",
            "Poor customer service",
            "Frequent technical issues",
            "Lack of training resources"
          ],
          useCases: [
            ["Basic daily tasks", "Simple workflows"],
            ["Family or team use", "Shared activities"],
            ["Occasional projects", "Specific needs"],
            ["Budget-conscious usage", "Essential features only"]
          ]
        },
        {
          ...baseProfiles[2],
          likes: [
            "Technical specifications and capabilities",
            "Security and privacy features",
            "Customization options",
            "Professional support",
            "Enterprise-grade reliability"
          ],
          dislikes: [
            "Unproven technology claims",
            "Vendor lock-in concerns",
            "Insufficient documentation",
            "Limited integration options",
            "Unclear long-term roadmap"
          ],
          useCases: [
            ["Technical evaluation", "Proof of concept"],
            ["Comparing alternatives", "Risk assessment"],
            ["Professional implementation", "Team deployment"],
            ["Long-term planning", "Strategic decisions"]
          ]
        }
      ];
  }
}
