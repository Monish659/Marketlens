// 100 Diverse Personas for Global Market Simulation
// Distribution: 35 US, 25 Europe, 20 Asia-Pacific, 20 Other

export const personas = [
  // United States (35 personas)
  {
    personaId: 1,
    name: "Sarah Chen",
    title: "VP of Product",
    location: {
      city: "San Francisco",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-122.4194, 37.7749] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Female",
      ageRange: "30-35"
    },
    professional: {
      seniority: "Executive Level",
      primaryIndustry: "Software Development",
      secondaryIndustry: "Product Management",
      companySize: "1000-5000",
      yearsExperience: 12
    },
    psychographics: {
      techAdoption: 9,
      riskTolerance: 7,
      priceSensitivity: 4,
      influenceScore: 8,
      brandLoyalty: 6
    },
    interests: ["AI", "Product Strategy", "User Research", "SaaS"],
    personality: {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.6,
      agreeableness: 0.5,
      neuroticism: 0.3
    },
    dataSources: ["linkedin", "web"]
  },
  {
    personaId: 2,
    name: "Marcus Johnson",
    title: "Software Engineer",
    location: {
      city: "Austin",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-97.7431, 30.2672] }
    },
    demographics: {
      generation: "Gen Z" as const,
      gender: "Male",
      ageRange: "22-27"
    },
    professional: {
      seniority: "Junior Level",
      primaryIndustry: "Software Development",
      companySize: "50-200",
      yearsExperience: 3
    },
    psychographics: {
      techAdoption: 10,
      riskTolerance: 8,
      priceSensitivity: 7,
      influenceScore: 5,
      brandLoyalty: 4
    },
    interests: ["Open Source", "Web3", "Gaming", "Startups"],
    personality: {
      openness: 0.9,
      conscientiousness: 0.5,
      extraversion: 0.4,
      agreeableness: 0.6,
      neuroticism: 0.4
    },
    dataSources: ["github", "twitter"]
  },
  {
    personaId: 3,
    name: "Emily Rodriguez",
    title: "Marketing Director",
    location: {
      city: "New York",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-74.0060, 40.7128] }
    },
    demographics: {
      generation: "Gen X" as const,
      gender: "Female",
      ageRange: "40-45"
    },
    professional: {
      seniority: "Director Level",
      primaryIndustry: "Marketing",
      secondaryIndustry: "E-commerce",
      companySize: "500-1000",
      yearsExperience: 18
    },
    psychographics: {
      techAdoption: 7,
      riskTolerance: 5,
      priceSensitivity: 5,
      influenceScore: 7,
      brandLoyalty: 8
    },
    interests: ["Digital Marketing", "Brand Strategy", "Analytics", "Consumer Psychology"],
    personality: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.7,
      agreeableness: 0.6,
      neuroticism: 0.3
    },
    dataSources: ["linkedin", "web"]
  },
  {
    personaId: 4,
    name: "David Kim",
    title: "Startup Founder",
    location: {
      city: "Los Angeles",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-118.2437, 34.0522] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Male",
      ageRange: "32-38"
    },
    professional: {
      seniority: "C-Level",
      primaryIndustry: "Entrepreneurship",
      secondaryIndustry: "EdTech",
      companySize: "1-10",
      yearsExperience: 10
    },
    psychographics: {
      techAdoption: 9,
      riskTolerance: 10,
      priceSensitivity: 6,
      influenceScore: 6,
      brandLoyalty: 3
    },
    interests: ["Venture Capital", "Innovation", "EdTech", "Growth Hacking"],
    personality: {
      openness: 0.9,
      conscientiousness: 0.6,
      extraversion: 0.8,
      agreeableness: 0.5,
      neuroticism: 0.5
    },
    dataSources: ["linkedin", "crunchbase"]
  },
  {
    personaId: 5,
    name: "Jessica Thompson",
    title: "Data Scientist",
    location: {
      city: "Seattle",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-122.3321, 47.6062] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Female",
      ageRange: "28-33"
    },
    professional: {
      seniority: "Senior Level",
      primaryIndustry: "Data Science",
      secondaryIndustry: "Machine Learning",
      companySize: "5000+",
      yearsExperience: 8
    },
    psychographics: {
      techAdoption: 10,
      riskTolerance: 6,
      priceSensitivity: 5,
      influenceScore: 6,
      brandLoyalty: 5
    },
    interests: ["Machine Learning", "Python", "Data Visualization", "Research"],
    personality: {
      openness: 0.8,
      conscientiousness: 0.9,
      extraversion: 0.3,
      agreeableness: 0.6,
      neuroticism: 0.2
    },
    dataSources: ["github", "kaggle"]
  },
  {
    personaId: 6,
    name: "Robert Miller",
    title: "CFO",
    location: {
      city: "Chicago",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-87.6298, 41.8781] }
    },
    demographics: {
      generation: "Boomer" as const,
      gender: "Male",
      ageRange: "55-60"
    },
    professional: {
      seniority: "C-Level",
      primaryIndustry: "Finance",
      secondaryIndustry: "Corporate Strategy",
      companySize: "1000-5000",
      yearsExperience: 30
    },
    psychographics: {
      techAdoption: 5,
      riskTolerance: 3,
      priceSensitivity: 3,
      influenceScore: 9,
      brandLoyalty: 9
    },
    interests: ["Finance", "Investment", "Golf", "Strategy"],
    personality: {
      openness: 0.4,
      conscientiousness: 0.9,
      extraversion: 0.5,
      agreeableness: 0.4,
      neuroticism: 0.2
    },
    dataSources: ["linkedin", "wsj"]
  },
  {
    personaId: 7,
    name: "Aaliyah Washington",
    title: "UX Designer",
    location: {
      city: "Portland",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-122.6765, 45.5152] }
    },
    demographics: {
      generation: "Gen Z" as const,
      gender: "Female",
      ageRange: "23-26"
    },
    professional: {
      seniority: "Mid Level",
      primaryIndustry: "Design",
      secondaryIndustry: "User Experience",
      companySize: "50-200",
      yearsExperience: 4
    },
    psychographics: {
      techAdoption: 9,
      riskTolerance: 7,
      priceSensitivity: 6,
      influenceScore: 5,
      brandLoyalty: 4
    },
    interests: ["Design Systems", "Accessibility", "Art", "Sustainability"],
    personality: {
      openness: 0.9,
      conscientiousness: 0.6,
      extraversion: 0.5,
      agreeableness: 0.8,
      neuroticism: 0.4
    },
    dataSources: ["dribbble", "behance"]
  },
  {
    personaId: 8,
    name: "Michael O'Brien",
    title: "Sales Director",
    location: {
      city: "Boston",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-71.0589, 42.3601] }
    },
    demographics: {
      generation: "Gen X" as const,
      gender: "Male",
      ageRange: "43-48"
    },
    professional: {
      seniority: "Director Level",
      primaryIndustry: "Sales",
      secondaryIndustry: "B2B Software",
      companySize: "200-500",
      yearsExperience: 20
    },
    psychographics: {
      techAdoption: 6,
      riskTolerance: 6,
      priceSensitivity: 4,
      influenceScore: 7,
      brandLoyalty: 7
    },
    interests: ["Sales Strategy", "Networking", "Sports", "Leadership"],
    personality: {
      openness: 0.6,
      conscientiousness: 0.7,
      extraversion: 0.9,
      agreeableness: 0.7,
      neuroticism: 0.3
    },
    dataSources: ["linkedin", "salesforce"]
  },
  {
    personaId: 9,
    name: "Lisa Chang",
    title: "Product Manager",
    location: {
      city: "Denver",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-104.9903, 39.7392] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Female",
      ageRange: "29-34"
    },
    professional: {
      seniority: "Senior Level",
      primaryIndustry: "Product Management",
      companySize: "100-500",
      yearsExperience: 7
    },
    psychographics: {
      techAdoption: 8,
      riskTolerance: 6,
      priceSensitivity: 5,
      influenceScore: 6,
      brandLoyalty: 5
    },
    interests: ["Agile", "User Research", "Hiking", "Photography"],
    personality: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.6,
      agreeableness: 0.7,
      neuroticism: 0.3
    },
    dataSources: ["linkedin", "medium"]
  },
  {
    personaId: 10,
    name: "James Wilson",
    title: "DevOps Engineer",
    location: {
      city: "Phoenix",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-112.0740, 33.4484] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Male",
      ageRange: "31-36"
    },
    professional: {
      seniority: "Senior Level",
      primaryIndustry: "Infrastructure",
      secondaryIndustry: "Cloud Computing",
      companySize: "500-1000",
      yearsExperience: 9
    },
    psychographics: {
      techAdoption: 10,
      riskTolerance: 5,
      priceSensitivity: 6,
      influenceScore: 4,
      brandLoyalty: 6
    },
    interests: ["Kubernetes", "Automation", "Linux", "Open Source"],
    personality: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.3,
      agreeableness: 0.5,
      neuroticism: 0.3
    },
    dataSources: ["github", "stackoverflow"]
  },
  
  // Adding more US personas (11-35)
  {
    personaId: 11,
    name: "Amanda Davis",
    title: "HR Director",
    location: {
      city: "Atlanta",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-84.3880, 33.7490] }
    },
    demographics: {
      generation: "Gen X" as const,
      gender: "Female",
      ageRange: "45-50"
    },
    professional: {
      seniority: "Director Level",
      primaryIndustry: "Human Resources",
      companySize: "1000-5000",
      yearsExperience: 22
    },
    psychographics: {
      techAdoption: 6,
      riskTolerance: 4,
      priceSensitivity: 5,
      influenceScore: 7,
      brandLoyalty: 8
    },
    interests: ["Leadership Development", "Culture", "DEI", "Wellness"],
    personality: {
      openness: 0.6,
      conscientiousness: 0.8,
      extraversion: 0.7,
      agreeableness: 0.8,
      neuroticism: 0.2
    },
    dataSources: ["linkedin", "shrm"]
  },
  {
    personaId: 12,
    name: "Tyler Martinez",
    title: "Growth Hacker",
    location: {
      city: "Miami",
      country: "United States",
      coordinates: { type: "Point", coordinates: [-80.1918, 25.7617] }
    },
    demographics: {
      generation: "Gen Z" as const,
      gender: "Male",
      ageRange: "24-27"
    },
    professional: {
      seniority: "Mid Level",
      primaryIndustry: "Growth Marketing",
      companySize: "10-50",
      yearsExperience: 4
    },
    psychographics: {
      techAdoption: 9,
      riskTolerance: 9,
      priceSensitivity: 7,
      influenceScore: 6,
      brandLoyalty: 3
    },
    interests: ["Growth Metrics", "A/B Testing", "Crypto", "Travel"],
    personality: {
      openness: 0.9,
      conscientiousness: 0.5,
      extraversion: 0.8,
      agreeableness: 0.5,
      neuroticism: 0.4
    },
    dataSources: ["twitter", "producthunt"]
  },

  // Europe (25 personas, starting at ID 36)
  {
    personaId: 36,
    name: "Oliver Schmidt",
    title: "CTO",
    location: {
      city: "Berlin",
      country: "Germany",
      coordinates: { type: "Point", coordinates: [13.4050, 52.5200] }
    },
    demographics: {
      generation: "Gen X" as const,
      gender: "Male",
      ageRange: "42-47"
    },
    professional: {
      seniority: "C-Level",
      primaryIndustry: "Technology",
      secondaryIndustry: "FinTech",
      companySize: "100-500",
      yearsExperience: 20
    },
    psychographics: {
      techAdoption: 9,
      riskTolerance: 7,
      priceSensitivity: 4,
      influenceScore: 8,
      brandLoyalty: 6
    },
    interests: ["Blockchain", "System Architecture", "Privacy", "Engineering Excellence"],
    personality: {
      openness: 0.8,
      conscientiousness: 0.9,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.2
    },
    dataSources: ["linkedin", "github"]
  },
  {
    personaId: 37,
    name: "Sophie Dubois",
    title: "Fashion Tech Entrepreneur",
    location: {
      city: "Paris",
      country: "France",
      coordinates: { type: "Point", coordinates: [2.3522, 48.8566] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Female",
      ageRange: "30-35"
    },
    professional: {
      seniority: "C-Level",
      primaryIndustry: "Fashion Tech",
      secondaryIndustry: "E-commerce",
      companySize: "10-50",
      yearsExperience: 12
    },
    psychographics: {
      techAdoption: 8,
      riskTolerance: 8,
      priceSensitivity: 3,
      influenceScore: 7,
      brandLoyalty: 7
    },
    interests: ["Sustainable Fashion", "AI", "Art", "Innovation"],
    personality: {
      openness: 0.9,
      conscientiousness: 0.7,
      extraversion: 0.7,
      agreeableness: 0.6,
      neuroticism: 0.3
    },
    dataSources: ["instagram", "linkedin"]
  },
  {
    personaId: 38,
    name: "James Williams",
    title: "Investment Banker",
    location: {
      city: "London",
      country: "United Kingdom",
      coordinates: { type: "Point", coordinates: [-0.1276, 51.5074] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Male",
      ageRange: "33-38"
    },
    professional: {
      seniority: "VP Level",
      primaryIndustry: "Finance",
      secondaryIndustry: "Investment Banking",
      companySize: "5000+",
      yearsExperience: 14
    },
    psychographics: {
      techAdoption: 7,
      riskTolerance: 5,
      priceSensitivity: 2,
      influenceScore: 7,
      brandLoyalty: 8
    },
    interests: ["FinTech", "Markets", "Golf", "Wine"],
    personality: {
      openness: 0.5,
      conscientiousness: 0.9,
      extraversion: 0.6,
      agreeableness: 0.4,
      neuroticism: 0.3
    },
    dataSources: ["linkedin", "ft"]
  },
  {
    personaId: 39,
    name: "Elena Rossi",
    title: "AI Researcher",
    location: {
      city: "Milan",
      country: "Italy",
      coordinates: { type: "Point", coordinates: [9.1900, 45.4642] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Female",
      ageRange: "28-32"
    },
    professional: {
      seniority: "Senior Level",
      primaryIndustry: "Research",
      secondaryIndustry: "Artificial Intelligence",
      companySize: "50-200",
      yearsExperience: 8
    },
    psychographics: {
      techAdoption: 10,
      riskTolerance: 6,
      priceSensitivity: 5,
      influenceScore: 6,
      brandLoyalty: 5
    },
    interests: ["Deep Learning", "Ethics in AI", "Classical Music", "Philosophy"],
    personality: {
      openness: 0.9,
      conscientiousness: 0.8,
      extraversion: 0.4,
      agreeableness: 0.6,
      neuroticism: 0.3
    },
    dataSources: ["arxiv", "github"]
  },
  {
    personaId: 40,
    name: "Lars Andersson",
    title: "Sustainability Director",
    location: {
      city: "Stockholm",
      country: "Sweden",
      coordinates: { type: "Point", coordinates: [18.0686, 59.3293] }
    },
    demographics: {
      generation: "Gen X" as const,
      gender: "Male",
      ageRange: "44-49"
    },
    professional: {
      seniority: "Director Level",
      primaryIndustry: "Sustainability",
      secondaryIndustry: "Clean Tech",
      companySize: "500-1000",
      yearsExperience: 20
    },
    psychographics: {
      techAdoption: 7,
      riskTolerance: 5,
      priceSensitivity: 4,
      influenceScore: 7,
      brandLoyalty: 9
    },
    interests: ["Climate Tech", "Renewable Energy", "Nordic Design", "Cycling"],
    personality: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.5,
      agreeableness: 0.8,
      neuroticism: 0.2
    },
    dataSources: ["linkedin", "climatereports"]
  },

  // Asia-Pacific (20 personas, starting at ID 61)
  {
    personaId: 61,
    name: "Yuki Tanaka",
    title: "Robotics Engineer",
    location: {
      city: "Tokyo",
      country: "Japan",
      coordinates: { type: "Point", coordinates: [139.6503, 35.6762] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Female",
      ageRange: "29-34"
    },
    professional: {
      seniority: "Senior Level",
      primaryIndustry: "Robotics",
      secondaryIndustry: "Manufacturing",
      companySize: "1000-5000",
      yearsExperience: 10
    },
    psychographics: {
      techAdoption: 10,
      riskTolerance: 4,
      priceSensitivity: 5,
      influenceScore: 5,
      brandLoyalty: 8
    },
    interests: ["Automation", "IoT", "Anime", "Innovation"],
    personality: {
      openness: 0.7,
      conscientiousness: 0.9,
      extraversion: 0.3,
      agreeableness: 0.7,
      neuroticism: 0.2
    },
    dataSources: ["github", "techblogs"]
  },
  {
    personaId: 62,
    name: "Raj Patel",
    title: "Mobile App Developer",
    location: {
      city: "Bangalore",
      country: "India",
      coordinates: { type: "Point", coordinates: [77.5946, 12.9716] }
    },
    demographics: {
      generation: "Gen Z" as const,
      gender: "Male",
      ageRange: "23-26"
    },
    professional: {
      seniority: "Mid Level",
      primaryIndustry: "Mobile Development",
      companySize: "50-200",
      yearsExperience: 3
    },
    psychographics: {
      techAdoption: 9,
      riskTolerance: 7,
      priceSensitivity: 8,
      influenceScore: 4,
      brandLoyalty: 5
    },
    interests: ["Flutter", "Cricket", "Startups", "EdTech"],
    personality: {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.5,
      agreeableness: 0.7,
      neuroticism: 0.3
    },
    dataSources: ["stackoverflow", "github"]
  },
  {
    personaId: 63,
    name: "Wei Chen",
    title: "E-commerce Director",
    location: {
      city: "Shanghai",
      country: "China",
      coordinates: { type: "Point", coordinates: [121.4737, 31.2304] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Male",
      ageRange: "32-37"
    },
    professional: {
      seniority: "Director Level",
      primaryIndustry: "E-commerce",
      secondaryIndustry: "Digital Marketing",
      companySize: "5000+",
      yearsExperience: 12
    },
    psychographics: {
      techAdoption: 8,
      riskTolerance: 6,
      priceSensitivity: 6,
      influenceScore: 7,
      brandLoyalty: 6
    },
    interests: ["Live Commerce", "Social Selling", "Travel", "Technology"],
    personality: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.6,
      agreeableness: 0.5,
      neuroticism: 0.3
    },
    dataSources: ["weibo", "linkedin"]
  },
  {
    personaId: 64,
    name: "Sarah Mitchell",
    title: "VC Partner",
    location: {
      city: "Singapore",
      country: "Singapore",
      coordinates: { type: "Point", coordinates: [103.8198, 1.3521] }
    },
    demographics: {
      generation: "Gen X" as const,
      gender: "Female",
      ageRange: "45-50"
    },
    professional: {
      seniority: "Partner Level",
      primaryIndustry: "Venture Capital",
      secondaryIndustry: "FinTech",
      companySize: "10-50",
      yearsExperience: 23
    },
    psychographics: {
      techAdoption: 8,
      riskTolerance: 8,
      priceSensitivity: 2,
      influenceScore: 9,
      brandLoyalty: 6
    },
    interests: ["Deep Tech", "Southeast Asia", "Women in Tech", "Golf"],
    personality: {
      openness: 0.8,
      conscientiousness: 0.8,
      extraversion: 0.7,
      agreeableness: 0.5,
      neuroticism: 0.2
    },
    dataSources: ["linkedin", "crunchbase"]
  },
  {
    personaId: 65,
    name: "Jack Thompson",
    title: "Digital Nomad Developer",
    location: {
      city: "Sydney",
      country: "Australia",
      coordinates: { type: "Point", coordinates: [151.2093, -33.8688] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Male",
      ageRange: "28-33"
    },
    professional: {
      seniority: "Senior Level",
      primaryIndustry: "Freelance Development",
      companySize: "1-10",
      yearsExperience: 8
    },
    psychographics: {
      techAdoption: 9,
      riskTolerance: 8,
      priceSensitivity: 6,
      influenceScore: 5,
      brandLoyalty: 3
    },
    interests: ["Remote Work", "Surfing", "Web3", "Travel Tech"],
    personality: {
      openness: 0.9,
      conscientiousness: 0.6,
      extraversion: 0.6,
      agreeableness: 0.7,
      neuroticism: 0.3
    },
    dataSources: ["twitter", "nomadlist"]
  },

  // Other Regions (20 personas, starting at ID 81)
  {
    personaId: 81,
    name: "Carlos Silva",
    title: "Startup Accelerator Director",
    location: {
      city: "São Paulo",
      country: "Brazil",
      coordinates: { type: "Point", coordinates: [-46.6333, -23.5505] }
    },
    demographics: {
      generation: "Gen X" as const,
      gender: "Male",
      ageRange: "41-46"
    },
    professional: {
      seniority: "Director Level",
      primaryIndustry: "Startup Ecosystem",
      companySize: "50-200",
      yearsExperience: 18
    },
    psychographics: {
      techAdoption: 8,
      riskTolerance: 7,
      priceSensitivity: 5,
      influenceScore: 8,
      brandLoyalty: 6
    },
    interests: ["Latin American Tech", "Impact Investing", "Football", "Innovation"],
    personality: {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.8,
      agreeableness: 0.7,
      neuroticism: 0.3
    },
    dataSources: ["linkedin", "latamstartups"]
  },
  {
    personaId: 82,
    name: "Amara Okonkwo",
    title: "FinTech Product Lead",
    location: {
      city: "Lagos",
      country: "Nigeria",
      coordinates: { type: "Point", coordinates: [3.3792, 6.5244] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Female",
      ageRange: "30-35"
    },
    professional: {
      seniority: "Lead Level",
      primaryIndustry: "FinTech",
      secondaryIndustry: "Mobile Banking",
      companySize: "100-500",
      yearsExperience: 9
    },
    psychographics: {
      techAdoption: 9,
      riskTolerance: 7,
      priceSensitivity: 7,
      influenceScore: 6,
      brandLoyalty: 5
    },
    interests: ["Mobile Money", "Financial Inclusion", "Afrobeat", "Tech4Good"],
    personality: {
      openness: 0.8,
      conscientiousness: 0.8,
      extraversion: 0.7,
      agreeableness: 0.7,
      neuroticism: 0.3
    },
    dataSources: ["twitter", "africantech"]
  },
  {
    personaId: 83,
    name: "Ahmed Al-Rashid",
    title: "Smart City Consultant",
    location: {
      city: "Dubai",
      country: "UAE",
      coordinates: { type: "Point", coordinates: [55.2708, 25.2048] }
    },
    demographics: {
      generation: "Millennial" as const,
      gender: "Male",
      ageRange: "33-38"
    },
    professional: {
      seniority: "Senior Level",
      primaryIndustry: "Smart Cities",
      secondaryIndustry: "IoT",
      companySize: "200-500",
      yearsExperience: 11
    },
    psychographics: {
      techAdoption: 9,
      riskTolerance: 6,
      priceSensitivity: 3,
      influenceScore: 7,
      brandLoyalty: 7
    },
    interests: ["IoT", "Sustainability", "Real Estate Tech", "Innovation"],
    personality: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.6,
      agreeableness: 0.6,
      neuroticism: 0.2
    },
    dataSources: ["linkedin", "smartcities"]
  },
  {
    personaId: 84,
    name: "Maria Gonzalez",
    title: "Head of Digital Transformation",
    location: {
      city: "Mexico City",
      country: "Mexico",
      coordinates: { type: "Point", coordinates: [-99.1332, 19.4326] }
    },
    demographics: {
      generation: "Gen X" as const,
      gender: "Female",
      ageRange: "42-47"
    },
    professional: {
      seniority: "Head Level",
      primaryIndustry: "Digital Transformation",
      companySize: "1000-5000",
      yearsExperience: 19
    },
    psychographics: {
      techAdoption: 8,
      riskTolerance: 5,
      priceSensitivity: 5,
      influenceScore: 7,
      brandLoyalty: 7
    },
    interests: ["Digital Strategy", "Change Management", "Art", "Travel"],
    personality: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.7,
      agreeableness: 0.7,
      neuroticism: 0.3
    },
    dataSources: ["linkedin", "medium"]
  },
  {
    personaId: 85,
    name: "Alex Johnson",
    title: "Blockchain Developer",
    location: {
      city: "Toronto",
      country: "Canada",
      coordinates: { type: "Point", coordinates: [-79.3832, 43.6532] }
    },
    demographics: {
      generation: "Gen Z" as const,
      gender: "Non-binary",
      ageRange: "24-27"
    },
    professional: {
      seniority: "Mid Level",
      primaryIndustry: "Blockchain",
      secondaryIndustry: "DeFi",
      companySize: "10-50",
      yearsExperience: 4
    },
    psychographics: {
      techAdoption: 10,
      riskTolerance: 9,
      priceSensitivity: 6,
      influenceScore: 5,
      brandLoyalty: 2
    },
    interests: ["Web3", "DeFi", "Gaming", "Open Source"],
    personality: {
      openness: 0.9,
      conscientiousness: 0.5,
      extraversion: 0.4,
      agreeableness: 0.6,
      neuroticism: 0.4
    },
    dataSources: ["github", "discord"]
  }
];

// Fill in remaining personas with variations
const additionalPersonas = [
  // More US personas (13-35)
  ...Array.from({ length: 23 }, (_, i) => ({
    personaId: 13 + i,
    name: generateName(i),
    title: selectTitle(i),
    location: selectUSCity(i),
    demographics: selectDemographics(i),
    professional: selectProfessional(i),
    psychographics: generatePsychographics(i),
    interests: selectInterests(i),
    personality: generatePersonality(i),
    dataSources: ["linkedin", "web"]
  })),
  
  // More European personas (41-60)
  ...Array.from({ length: 20 }, (_, i) => ({
    personaId: 41 + i,
    name: generateEuropeanName(i),
    title: selectTitle(i + 23),
    location: selectEuropeanCity(i),
    demographics: selectDemographics(i + 23),
    professional: selectProfessional(i + 23),
    psychographics: generatePsychographics(i + 23),
    interests: selectInterests(i + 23),
    personality: generatePersonality(i + 23),
    dataSources: ["linkedin", "web"]
  })),
  
  // More APAC personas (66-80)
  ...Array.from({ length: 15 }, (_, i) => ({
    personaId: 66 + i,
    name: generateAPACName(i),
    title: selectTitle(i + 43),
    location: selectAPACCity(i),
    demographics: selectDemographics(i + 43),
    professional: selectProfessional(i + 43),
    psychographics: generatePsychographics(i + 43),
    interests: selectInterests(i + 43),
    personality: generatePersonality(i + 43),
    dataSources: ["linkedin", "web"]
  })),
  
  // More Other regions (86-100)
  ...Array.from({ length: 15 }, (_, i) => ({
    personaId: 86 + i,
    name: generateGlobalName(i),
    title: selectTitle(i + 58),
    location: selectGlobalCity(i),
    demographics: selectDemographics(i + 58),
    professional: selectProfessional(i + 58),
    psychographics: generatePsychographics(i + 58),
    interests: selectInterests(i + 58),
    personality: generatePersonality(i + 58),
    dataSources: ["linkedin", "web"]
  }))
];

// Helper functions for generating diverse personas
function generateName(index: number): string {
  const names = [
    "Brandon Lee", "Michelle Garcia", "Kevin Patel", "Ashley Brown",
    "Christopher Moore", "Stephanie Williams", "Daniel Anderson",
    "Nicole Taylor", "Matthew Jackson", "Rebecca White", "Joseph Harris",
    "Jennifer Martin", "Andrew Thompson", "Samantha Clark", "Joshua Lewis",
    "Brittany Walker", "Ryan Hall", "Megan Allen", "Justin Young",
    "Rachel King", "Nicholas Wright", "Victoria Scott", "Eric Green"
  ];
  return names[index % names.length];
}

function generateEuropeanName(index: number): string {
  const names = [
    "Pierre Lefebvre", "Anna Mueller", "Marco Bianchi", "Katja Nielsen",
    "Pablo Fernandez", "Ingrid Larsson", "Tomasz Kowalski", "Elsa Van Der Berg",
    "Dimitri Volkov", "Clara Hoffmann", "João Santos", "Emma O'Sullivan",
    "Viktor Nagy", "Sophia Papadopoulos", "Jan Novak", "Isabella Romano",
    "Hans Fischer", "Marie Laurent", "Aleksander Petrov", "Laura Costa"
  ];
  return names[index % names.length];
}

function generateAPACName(index: number): string {
  const names = [
    "Hiroshi Yamamoto", "Priya Sharma", "Zhang Wei", "Kim Min-jung",
    "Nguyen Van Nam", "Siti Nurhaliza", "Ravi Kumar", "Akiko Sato",
    "Li Ming", "Fatima Khan", "Toshiro Nakamura", "Anjali Desai",
    "Park Ji-woo", "Chen Xiaoming", "Arjun Singh"
  ];
  return names[index % names.length];
}

function generateGlobalName(index: number): string {
  const names = [
    "Pedro Rodriguez", "Fatou Diallo", "Ivan Petrov", "Leila Hassan",
    "Gabriel Costa", "Zara Khan", "Omar Khalil", "Ana Lucia Silva",
    "Dmitry Volkov", "Aisha Patel", "Roberto Fernandez", "Nadia Ibrahim",
    "Santiago Morales", "Yasmin Ali", "Andrei Popov"
  ];
  return names[index % names.length];
}

function selectTitle(index: number): string {
  const titles = [
    "Software Engineer", "Product Manager", "Marketing Manager", "Data Analyst",
    "UX Designer", "Sales Representative", "Business Analyst", "DevOps Engineer",
    "HR Manager", "Financial Analyst", "Operations Manager", "Customer Success Manager",
    "Team Lead", "Growth Manager", "People Operations Lead", "Account Executive",
    "Engineering Manager", "HR Business Partner", "Project Manager", "Talent Acquisition Manager"
  ];
  return titles[index % titles.length];
}

function selectUSCity(index: number) {
  const cities = [
    { city: "Houston", country: "United States", coordinates: { type: "Point", coordinates: [-95.3698, 29.7604] }},
    { city: "Philadelphia", country: "United States", coordinates: { type: "Point", coordinates: [-75.1652, 39.9526] }},
    { city: "San Diego", country: "United States", coordinates: { type: "Point", coordinates: [-117.1611, 32.7157] }},
    { city: "Dallas", country: "United States", coordinates: { type: "Point", coordinates: [-96.7970, 32.7767] }},
    { city: "San Jose", country: "United States", coordinates: { type: "Point", coordinates: [-121.8863, 37.3382] }},
    { city: "Indianapolis", country: "United States", coordinates: { type: "Point", coordinates: [-86.1581, 39.7684] }},
    { city: "Columbus", country: "United States", coordinates: { type: "Point", coordinates: [-82.9988, 39.9612] }},
    { city: "Charlotte", country: "United States", coordinates: { type: "Point", coordinates: [-80.8431, 35.2271] }},
    { city: "Detroit", country: "United States", coordinates: { type: "Point", coordinates: [-83.0458, 42.3314] }},
    { city: "Nashville", country: "United States", coordinates: { type: "Point", coordinates: [-86.7816, 36.1627] }},
    { city: "Memphis", country: "United States", coordinates: { type: "Point", coordinates: [-90.0490, 35.1495] }},
    { city: "Baltimore", country: "United States", coordinates: { type: "Point", coordinates: [-76.6122, 39.2904] }},
    { city: "Milwaukee", country: "United States", coordinates: { type: "Point", coordinates: [-87.9065, 43.0389] }},
    { city: "Albuquerque", country: "United States", coordinates: { type: "Point", coordinates: [-106.6504, 35.0844] }},
    { city: "Tucson", country: "United States", coordinates: { type: "Point", coordinates: [-110.9747, 32.2226] }},
    { city: "Sacramento", country: "United States", coordinates: { type: "Point", coordinates: [-121.4944, 38.5816] }},
    { city: "Kansas City", country: "United States", coordinates: { type: "Point", coordinates: [-94.5786, 39.0997] }},
    { city: "Mesa", country: "United States", coordinates: { type: "Point", coordinates: [-111.8315, 33.4152] }},
    { city: "Virginia Beach", country: "United States", coordinates: { type: "Point", coordinates: [-75.9780, 36.8529] }},
    { city: "Omaha", country: "United States", coordinates: { type: "Point", coordinates: [-95.9345, 41.2565] }},
    { city: "Raleigh", country: "United States", coordinates: { type: "Point", coordinates: [-78.6382, 35.7796] }},
    { city: "Minneapolis", country: "United States", coordinates: { type: "Point", coordinates: [-93.2650, 44.9778] }},
    { city: "Tampa", country: "United States", coordinates: { type: "Point", coordinates: [-82.4572, 27.9506] }}
  ];
  return cities[index % cities.length];
}

function selectEuropeanCity(index: number) {
  const cities = [
    { city: "Amsterdam", country: "Netherlands", coordinates: { type: "Point", coordinates: [4.8952, 52.3702] }},
    { city: "Barcelona", country: "Spain", coordinates: { type: "Point", coordinates: [2.1734, 41.3851] }},
    { city: "Munich", country: "Germany", coordinates: { type: "Point", coordinates: [11.5820, 48.1351] }},
    { city: "Vienna", country: "Austria", coordinates: { type: "Point", coordinates: [16.3738, 48.2082] }},
    { city: "Brussels", country: "Belgium", coordinates: { type: "Point", coordinates: [4.3517, 50.8503] }},
    { city: "Copenhagen", country: "Denmark", coordinates: { type: "Point", coordinates: [12.5683, 55.6761] }},
    { city: "Dublin", country: "Ireland", coordinates: { type: "Point", coordinates: [-6.2603, 53.3498] }},
    { city: "Edinburgh", country: "United Kingdom", coordinates: { type: "Point", coordinates: [-3.1883, 55.9533] }},
    { city: "Helsinki", country: "Finland", coordinates: { type: "Point", coordinates: [24.9384, 60.1699] }},
    { city: "Lisbon", country: "Portugal", coordinates: { type: "Point", coordinates: [-9.1393, 38.7223] }},
    { city: "Madrid", country: "Spain", coordinates: { type: "Point", coordinates: [-3.7038, 40.4168] }},
    { city: "Oslo", country: "Norway", coordinates: { type: "Point", coordinates: [10.7522, 59.9139] }},
    { city: "Prague", country: "Czech Republic", coordinates: { type: "Point", coordinates: [14.4378, 50.0755] }},
    { city: "Rome", country: "Italy", coordinates: { type: "Point", coordinates: [12.4964, 41.9028] }},
    { city: "Warsaw", country: "Poland", coordinates: { type: "Point", coordinates: [21.0122, 52.2297] }},
    { city: "Zurich", country: "Switzerland", coordinates: { type: "Point", coordinates: [8.5417, 47.3769] }},
    { city: "Athens", country: "Greece", coordinates: { type: "Point", coordinates: [23.7275, 37.9838] }},
    { city: "Budapest", country: "Hungary", coordinates: { type: "Point", coordinates: [19.0402, 47.4979] }},
    { city: "Hamburg", country: "Germany", coordinates: { type: "Point", coordinates: [9.9937, 53.5511] }},
    { city: "Lyon", country: "France", coordinates: { type: "Point", coordinates: [4.8357, 45.7640] }}
  ];
  return cities[index % cities.length];
}

function selectAPACCity(index: number) {
  const cities = [
    { city: "Seoul", country: "South Korea", coordinates: { type: "Point", coordinates: [126.9780, 37.5665] }},
    { city: "Mumbai", country: "India", coordinates: { type: "Point", coordinates: [72.8777, 19.0760] }},
    { city: "Hong Kong", country: "China", coordinates: { type: "Point", coordinates: [114.1694, 22.3193] }},
    { city: "Bangkok", country: "Thailand", coordinates: { type: "Point", coordinates: [100.5018, 13.7563] }},
    { city: "Jakarta", country: "Indonesia", coordinates: { type: "Point", coordinates: [106.8456, -6.2088] }},
    { city: "Manila", country: "Philippines", coordinates: { type: "Point", coordinates: [120.9842, 14.5995] }},
    { city: "Kuala Lumpur", country: "Malaysia", coordinates: { type: "Point", coordinates: [101.6869, 3.1390] }},
    { city: "Ho Chi Minh City", country: "Vietnam", coordinates: { type: "Point", coordinates: [106.6297, 10.8231] }},
    { city: "Delhi", country: "India", coordinates: { type: "Point", coordinates: [77.1025, 28.7041] }},
    { city: "Beijing", country: "China", coordinates: { type: "Point", coordinates: [116.4074, 39.9042] }},
    { city: "Melbourne", country: "Australia", coordinates: { type: "Point", coordinates: [144.9631, -37.8136] }},
    { city: "Auckland", country: "New Zealand", coordinates: { type: "Point", coordinates: [174.7633, -36.8485] }},
    { city: "Taipei", country: "Taiwan", coordinates: { type: "Point", coordinates: [121.5654, 25.0330] }},
    { city: "Osaka", country: "Japan", coordinates: { type: "Point", coordinates: [135.5022, 34.6937] }},
    { city: "Brisbane", country: "Australia", coordinates: { type: "Point", coordinates: [153.0251, -27.4698] }}
  ];
  return cities[index % cities.length];
}

function selectGlobalCity(index: number) {
  const cities = [
    { city: "Buenos Aires", country: "Argentina", coordinates: { type: "Point", coordinates: [-58.3816, -34.6037] }},
    { city: "Cape Town", country: "South Africa", coordinates: { type: "Point", coordinates: [18.4241, -33.9249] }},
    { city: "Cairo", country: "Egypt", coordinates: { type: "Point", coordinates: [31.2357, 30.0444] }},
    { city: "Tel Aviv", country: "Israel", coordinates: { type: "Point", coordinates: [34.7818, 32.0853] }},
    { city: "Istanbul", country: "Turkey", coordinates: { type: "Point", coordinates: [28.9784, 41.0082] }},
    { city: "Johannesburg", country: "South Africa", coordinates: { type: "Point", coordinates: [28.0473, -26.2041] }},
    { city: "Nairobi", country: "Kenya", coordinates: { type: "Point", coordinates: [36.8219, -1.2864] }},
    { city: "Casablanca", country: "Morocco", coordinates: { type: "Point", coordinates: [-7.5898, 33.5731] }},
    { city: "Santiago", country: "Chile", coordinates: { type: "Point", coordinates: [-70.6693, -33.4489] }},
    { city: "Lima", country: "Peru", coordinates: { type: "Point", coordinates: [-77.0428, -12.0464] }},
    { city: "Bogota", country: "Colombia", coordinates: { type: "Point", coordinates: [-74.0721, 4.7110] }},
    { city: "Vancouver", country: "Canada", coordinates: { type: "Point", coordinates: [-123.1207, 49.2827] }},
    { city: "Montreal", country: "Canada", coordinates: { type: "Point", coordinates: [-73.5673, 45.5017] }},
    { city: "Riyadh", country: "Saudi Arabia", coordinates: { type: "Point", coordinates: [46.7219, 24.6877] }},
    { city: "Kuwait City", country: "Kuwait", coordinates: { type: "Point", coordinates: [47.9774, 29.3759] }}
  ];
  return cities[index % cities.length];
}

function selectDemographics(index: number) {
  const generations = ["Gen Z", "Millennial", "Gen X", "Boomer"] as const;
  const genders = ["Male", "Female", "Non-binary"];
  const ageRanges = ["22-27", "28-33", "34-39", "40-45", "46-51", "52-57", "58-65"];
  
  return {
    generation: generations[index % 4],
    gender: genders[index % 3],
    ageRange: ageRanges[index % 7]
  };
}

function selectProfessional(index: number) {
  const seniorities = ["Junior Level", "Mid Level", "Senior Level", "Lead Level", "Manager Level", "Director Level", "VP Level", "C-Level"];
  const industries = [
    "Software Development", "Marketing", "Sales", "Finance", "Operations",
    "Product Management", "Design", "Data Science", "Human Resources", "Engineering"
  ];
  const companySizes = ["1-10", "10-50", "50-200", "200-500", "500-1000", "1000-5000", "5000+"];
  
  return {
    seniority: seniorities[index % 8],
    primaryIndustry: industries[index % 10],
    companySize: companySizes[index % 7],
    yearsExperience: 3 + (index % 25)
  };
}

function generatePsychographics(index: number) {
  return {
    techAdoption: 5 + (index % 6),
    riskTolerance: 3 + (index % 8),
    priceSensitivity: 2 + (index % 8),
    influenceScore: 4 + (index % 7),
    brandLoyalty: 3 + (index % 8)
  };
}

function selectInterests(index: number) {
  const interestSets = [
    ["AI", "Machine Learning", "Data Science", "Python"],
    ["Marketing", "SEO", "Content", "Analytics"],
    ["Startups", "Entrepreneurship", "Innovation", "Growth"],
    ["Design", "UX", "UI", "Product"],
    ["Finance", "Investment", "Trading", "Crypto"],
    ["Sales", "B2B", "CRM", "Networking"],
    ["DevOps", "Cloud", "AWS", "Docker"],
    ["Mobile", "iOS", "Android", "React Native"],
    ["Gaming", "VR", "AR", "Unity"],
    ["Security", "Privacy", "Compliance", "Blockchain"]
  ];
  return interestSets[index % 10];
}

function generatePersonality(index: number) {
  return {
    openness: 0.4 + (index % 6) * 0.1,
    conscientiousness: 0.5 + (index % 5) * 0.1,
    extraversion: 0.3 + (index % 7) * 0.1,
    agreeableness: 0.4 + (index % 6) * 0.1,
    neuroticism: 0.2 + (index % 4) * 0.1
  };
}

// Combine all personas
export const allPersonas = [...personas, ...additionalPersonas];

// Validate we have exactly 100 personas
if (allPersonas.length !== 100) {
  console.warn(`Expected 100 personas but got ${allPersonas.length}`);
}
