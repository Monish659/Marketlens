// Dynamic comment generation based on persona characteristics
import { IPersona } from '@/models/Persona';

interface CommentContext {
  persona: IPersona;
  platform: string;
  postCategory: string;
  valueProps: string[];
}

// Generate unique comments by combining persona traits with content
export function generateUniqueComment(
  context: CommentContext,
  attention: string,
  sentiment: number
): string | undefined {
  if (attention !== 'full') return undefined;
  
  const { persona, platform, postCategory, valueProps } = context;
  
  // Check if this is personal content
  if (postCategory.toLowerCase().includes('personal')) {
    // Generate appropriate response for personal content
    const responses = [
      'Thanks for sharing.',
      'Appreciate you sharing this.',
      'Thank you for your openness.',
      'Wishing you all the best.',
      'Thanks for letting us know.',
      'Appreciate the update.'
    ];
    return responses[persona.personaId % responses.length];
  }
  
  // Build comment components based on persona
  const components = {
    opening: getOpening(persona, platform, sentiment),
    middle: getMiddle(persona, postCategory, valueProps),
    closing: getClosing(persona, platform)
  };
  
  // Combine with persona-specific variations
  const comment = constructComment(components, persona, platform);
  
  return comment;
}

function getOpening(persona: IPersona, platform: string, sentiment: number): string[] {
  const openings: string[] = [];
  
  // Professional openings for LinkedIn
  if (platform === 'linkedin') {
    if (persona.professional.seniority.includes('C-Level') || persona.professional.seniority.includes('VP')) {
      openings.push(
        `From a ${persona.professional.seniority} perspective`,
        `As someone leading a ${persona.professional.companySize} company`,
        `In my experience at the executive level`,
        `Having seen many solutions in ${persona.professional.primaryIndustry}`,
        `Leading teams in ${persona.location.city}`,
        `After ${persona.professional.yearsExperience} years in ${persona.professional.primaryIndustry}`,
        `From an enterprise standpoint`,
        `Strategic perspective here`
      );
    } else if (persona.professional.seniority.includes('Manager')) {
      openings.push(
        `Our team has been looking for something like this`,
        `This could really help our department`,
        `As a ${persona.title}`,
        `From a management perspective`,
        `Managing teams in ${persona.professional.primaryIndustry}`,
        `Our ${persona.professional.companySize} team needs this`,
        `Been searching for this solution`,
        `This hits home for us`
      );
    } else {
      openings.push(
        `As a ${persona.title} in ${persona.professional.primaryIndustry}`,
        `Working in ${persona.location.city}`,
        `This is exactly what we need`,
        `Really impressed by this`,
        `${persona.professional.yearsExperience} years in the field`,
        `From ${persona.location.country} perspective`,
        `In my role at a ${persona.professional.companySize} company`,
        `This resonates strongly`
      );
    }
  }
  
  // Casual openings for Instagram
  else if (platform === 'instagram') {
    if (persona.demographics.generation === 'Gen Z') {
      openings.push(
        `This is it`,
        `No way`,
        `Actually obsessed`,
        `Wait this is genius`
      );
    } else if (persona.demographics.generation === 'Millennial') {
      openings.push(
        `Love this`,
        `So good`,
        `This is amazing`,
        `Wow`
      );
    } else {
      openings.push(
        `Very interesting`,
        `Great to see this`,
        `Impressive`,
        `Well done`
      );
    }
  }
  
  // Quick openings for Twitter
  else if (platform === 'twitter') {
    openings.push(
      `This`,
      `Finally`,
      `Interesting`,
      `Game changer`,
      `Hot take but`,
      `Actually`
    );
  }
  
  // Default professional
  else {
    openings.push(
      `This is compelling`,
      `Interesting approach`,
      `Worth noting`,
      `Good to see`
    );
  }
  
  return openings;
}

function getMiddle(persona: IPersona, postCategory: string, valueProps: string[]): string[] {
  const middles: string[] = [];
  
  // Industry-specific observations
  if (persona.professional.primaryIndustry.toLowerCase().includes('tech') || 
      persona.professional.primaryIndustry.toLowerCase().includes('software')) {
    middles.push(
      `the technical implementation looks solid`,
      `the architecture seems well thought out`,
      `the scalability potential is clear`,
      `the innovation here is notable`,
      `this could integrate well with our stack`,
      `the tech approach is spot on`,
      `love the modern tech stack`,
      `the API design looks clean`,
      `performance metrics are impressive`,
      `security considerations are well handled`
    );
  } else if (persona.professional.primaryIndustry.toLowerCase().includes('finance') ||
             persona.professional.primaryIndustry.toLowerCase().includes('fintech')) {
    middles.push(
      `the ROI calculation makes sense`,
      `the cost-benefit analysis is compelling`,
      `the financial model looks promising`,
      `the value proposition is clear`,
      `compliance aspects are well covered`,
      `risk management looks thorough`,
      `the pricing model is competitive`,
      `transaction handling seems robust`,
      `regulatory considerations addressed`,
      `the financial impact could be significant`
    );
  } else if (persona.professional.primaryIndustry.toLowerCase().includes('marketing')) {
    middles.push(
      `the market positioning is smart`,
      `the target audience alignment is spot on`,
      `the branding approach works well`,
      `the messaging resonates`,
      `great go-to-market strategy`,
      `the customer journey is well mapped`,
      `conversion optimization looks strong`,
      `solid content strategy`,
      `the analytics integration is key`,
      `engagement metrics will be interesting`
    );
  } else if (persona.professional.primaryIndustry.toLowerCase().includes('healthcare')) {
    middles.push(
      `the patient impact could be significant`,
      `the healthcare applications are promising`,
      `the compliance considerations seem addressed`,
      `the clinical value is evident`,
      `HIPAA compliance looks solid`,
      `patient outcomes could improve`,
      `the medical accuracy is important`,
      `integration with EHR systems is key`,
      `healthcare workflow optimization is clear`,
      `clinical trials data looks promising`
    );
  } else {
    middles.push(
      `this addresses a real need in ${persona.professional.primaryIndustry}`,
      `the approach is innovative`,
      `the execution looks strong`,
      `the timing is perfect`,
      `this could transform how we work`,
      `the potential impact is huge`,
      `implementation seems straightforward`,
      `the use cases are compelling`,
      `this fills a gap in the market`,
      `the competitive advantage is clear`
    );
  }
  
  // Add value prop specific comments with more variety
  if (valueProps && valueProps.length > 0) {
    const prop = valueProps[0].toLowerCase();
    if (prop.includes('cost') || prop.includes('save')) {
      middles.push(
        `especially the cost savings aspect`,
        `the pricing is very attractive`,
        `ROI looks compelling`,
        `budget-friendly approach`
      );
    }
    if (prop.includes('speed') || prop.includes('fast')) {
      middles.push(
        `particularly the speed improvements`,
        `time savings are crucial`,
        `efficiency gains are clear`,
        `quick implementation is key`
      );
    }
    if (prop.includes('easy') || prop.includes('simple')) {
      middles.push(
        `love the simplicity`,
        `user-friendly approach`,
        `low learning curve is great`,
        `intuitive design`
      );
    }
    if (prop.includes('scale') || prop.includes('growth')) {
      middles.push(
        `scalability is impressive`,
        `growth potential is clear`,
        `enterprise-ready from day one`,
        `can grow with our needs`
      );
    }
  }
  
  return middles;
}

function getClosing(persona: IPersona, platform: string): string[] {
  const closings: string[] = [];
  
  if (platform === 'linkedin') {
    if (persona.professional.seniority.includes('Level')) {
      closings.push(
        `. Would love to explore a pilot program.`,
        `. Let's connect to discuss further.`,
        `. Interested in learning more about enterprise options.`,
        `. This could be strategic for us.`,
        `. Please reach out to discuss implementation.`,
        `. We should schedule a demo.`,
        `. This aligns with our Q${Math.ceil(Math.random() * 4)} goals.`,
        `. Adding this to our evaluation list.`,
        `. My team needs to see this.`,
        `. Let's explore partnership opportunities.`
      );
    } else {
      closings.push(
        `. Will share with my team!`,
        `. Definitely worth exploring.`,
        `. Looking forward to seeing this evolve.`,
        `. Great work on this!`,
        `. Following for updates.`,
        `. Bookmarking this for later.`,
        `. Excited to try this out.`,
        `. This is game-changing.`,
        `. Can't wait to implement this.`,
        `. Sharing with colleagues.`
      );
    }
  } else if (platform === 'instagram') {
    if (persona.demographics.generation === 'Gen Z' || persona.demographics.generation === 'Millennial') {
      closings.push(
        ` 🔥🔥🔥`,
        ` 💯`,
        ` ✨`,
        ` 🚀`,
        `!!`,
        ` 😍`
      );
    } else {
      closings.push(
        `!`,
        `.`,
        ` 👍`,
        ` - well done`
      );
    }
  } else if (platform === 'twitter') {
    closings.push(
      `.`,
      `!`,
      ` 🚀`,
      ` 👆`,
      `. RT'd`,
      `. This is it.`
    );
  } else {
    closings.push(
      `.`,
      `!`,
      `. Thank you for sharing.`,
      `. Keep up the good work.`
    );
  }
  
  return closings;
}

function constructComment(
  components: { opening: string[], middle: string[], closing: string[] },
  persona: IPersona,
  platform: string
): string {
  // Use persona ID and characteristics to create varied selection with some randomness
  const seed = persona.personaId + persona.professional.yearsExperience + persona.psychographics.techAdoption;
  const randomFactor = Math.floor(Math.random() * 3); // Add some randomness
  
  const openingIndex = (seed + randomFactor) % components.opening.length;
  const middleIndex = (seed * 2 + randomFactor) % components.middle.length;
  const closingIndex = (seed * 3 + randomFactor) % components.closing.length;
  
  const opening = components.opening[openingIndex] || components.opening[0];
  const middle = components.middle[middleIndex] || components.middle[0];
  const closing = components.closing[closingIndex] || components.closing[0];
  
  // Construct based on platform style
  if (platform === 'linkedin') {
    // Professional, complete sentences
    return `${opening}, ${middle}${closing}`;
  } else if (platform === 'instagram' || platform === 'tiktok') {
    // Casual, may skip components
    if (persona.demographics.generation === 'Gen Z') {
      // More casual for Gen Z
      return seed % 2 === 0 ? `${opening} ${closing}` : `${middle}${closing}`;
    }
    return `${opening}! ${middle[0].toUpperCase() + middle.slice(1)}${closing}`;
  } else if (platform === 'twitter') {
    // Brief
    return seed % 3 === 0 ? `${opening}${closing}` : `${opening}. ${middle[0].toUpperCase() + middle.slice(1)}${closing}`;
  } else {
    return `${opening}, ${middle}${closing}`;
  }
}

// Generate reasons that are unique to each persona
export function generateUniqueReason(
  persona: IPersona,
  platform: string,
  attention: string,
  postCategory: string
): string {
  // Check if this is personal content - but add variety
  if (postCategory.toLowerCase().includes('personal')) {
    const seed = persona.personaId + persona.professional.yearsExperience;
    
    if (attention === 'full') {
      const supportiveReasons = [
        'Supporting a connection',
        'Appreciate the personal share',
        'Celebrating with you',
        'Thanks for the vulnerability',
        'Love seeing authentic posts',
        'Brave to share this here',
        'Important message to share',
        'Respect the openness'
      ];
      return supportiveReasons[seed % supportiveReasons.length];
    } else if (attention === 'partial') {
      const partialReasons = [
        `Unexpected content on ${platform}`,
        'Not what I expected here',
        'Interesting choice of platform',
        `${platform} might not be the best place`,
        'Would engage elsewhere',
        'Better suited for other platforms',
        'Mixed feelings about this here',
        `Surprising to see on ${platform}`
      ];
      return partialReasons[seed % partialReasons.length];
    } else {
      const ignoreReasons = [
        `Not appropriate for ${platform}`,
        'Wrong platform for personal shares',
        'Prefer professional content here',
        `Looking for business content on ${platform}`,
        'Not what I follow for',
        'Doesn\'t match platform purpose',
        'Not relevant to my professional network',
        'Scrolling past personal posts'
      ];
      return ignoreReasons[seed % ignoreReasons.length];
    }
  }
  
  const reasons = {
    full: [] as string[],
    partial: [] as string[],
    ignore: [] as string[]
  };
  
  // Build reason based on multiple factors
  const industry = persona.professional.primaryIndustry;
  const seniority = persona.professional.seniority;
  const generation = persona.demographics.generation;
  const city = persona.location.city;
  const companySize = persona.professional.companySize;
  
  if (attention === 'full') {
    // Combine multiple attributes for unique reasons
    reasons.full = [
      `Highly relevant to my work as ${persona.title} in ${industry}`,
      `Perfect timing for our ${companySize} company in ${city}`,
      `Aligns with ${generation} professionals in ${industry}`,
      `Addresses challenges I face as a ${seniority} in ${industry}`,
      `Exactly what ${industry} needs right now`,
      `Solves problems we have in ${city}'s ${industry} sector`,
      `Matches our ${companySize} company's current priorities`,
      `As a ${persona.title}, this is highly actionable`,
      `Relevant to ${generation} leaders in ${industry}`,
      `Critical for ${seniority} professionals like myself`
    ];
  } else if (attention === 'partial') {
    reasons.partial = [
      `Somewhat relevant to ${industry} but not urgent`,
      `Interesting for ${companySize} companies, needs more detail`,
      `Could work in ${city}, but not a priority`,
      `${generation} professionals might find this useful`,
      `As a ${persona.title}, I see potential but need more`,
      `Partially aligns with ${industry} needs`,
      `${seniority} level might consider this later`,
      `Not bad for ${companySize} companies`,
      `Mildly interesting to ${generation} in ${industry}`,
      `Worth monitoring for ${city} market`
    ];
  } else {
    reasons.ignore = [
      `Not relevant to ${industry} professionals`,
      `Doesn't fit ${companySize} company needs`,
      `Not applicable in ${city} market`,
      `${generation} professionals won't engage with this`,
      `As a ${persona.title}, this isn't useful`,
      `Outside ${industry} focus area`,
      `${seniority} level wouldn't prioritize this`,
      `Wrong fit for ${companySize} companies`,
      `Not what ${generation} is looking for`,
      `Doesn't solve ${city}'s ${industry} challenges`,
      `Busy with other ${industry} priorities`,
      `Not aligned with my ${seniority} responsibilities`,
      `${city} market has different needs`,
      `My ${companySize} org won't benefit`,
      `Outside my ${persona.title} scope`,
      `Not a ${generation} priority`,
      `Doesn't address ${industry} pain points`,
      `Wrong timing for ${companySize} companies`
    ];
  }
  
  // Select with some randomness for variety
  const reasonList = reasons[attention as keyof typeof reasons];
  const randomOffset = Math.floor(Math.random() * 3);
  const index = (persona.personaId + persona.professional.yearsExperience + randomOffset) % reasonList.length;
  
  return reasonList[index] || `${attention === 'full' ? 'Highly' : attention === 'partial' ? 'Somewhat' : 'Not'} relevant to my role`;
}
