// Alternative configurations for the voice agent
// You can copy these into the voice-agent.tsx component to experiment with different settings

export const voiceOptions = {
  // Female voices
  jennifer: {
    provider: 'playht',
    voiceId: 'jennifer',
  },
  sarah: {
    provider: 'playht',
    voiceId: 'sarah',
  },
  
  // Male voices
  matthew: {
    provider: 'playht',
    voiceId: 'matthew',
  },
  
  // ElevenLabs voices (requires ElevenLabs API key)
  rachel: {
    provider: 'elevenlabs',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
  },
  adam: {
    provider: 'elevenlabs',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
  },
};

export const modelOptions = {
  // OpenAI Models
  gpt4Turbo: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
  },
  gpt4: {
    provider: 'openai',
    model: 'gpt-4',
  },
  gpt35Turbo: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
  },
  
  // Anthropic Models (requires Anthropic API key)
  claude3Opus: {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
  },
  claude3Sonnet: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
  },
  
  // Together AI Models (requires Together API key)
  mixtral: {
    provider: 'together',
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  },
  llama2: {
    provider: 'together',
    model: 'meta-llama/Llama-2-70b-chat-hf',
  },
  
  // Groq Models (requires Groq API key)
  groqMixtral: {
    provider: 'groq',
    model: 'mixtral-8x7b-32768',
  },
};

export const systemPrompts = {
  // General assistant
  general: `You are a highly intelligent, friendly, and versatile AI assistant with a natural conversational style.
    Be helpful, engaging, and adapt to any topic the user wants to discuss.
    Keep responses concise for voice interaction (2-4 sentences unless more detail is requested).`,
  
  // Creative writing assistant
  creative: `You are a creative writing assistant with a passion for storytelling.
    Help users brainstorm ideas, develop characters, craft plots, and improve their writing.
    Be imaginative, encouraging, and offer specific suggestions.
    Keep voice responses engaging but concise.`,
  
  // Technical assistant
  technical: `You are a technical expert specializing in programming, software development, and technology.
    Help users debug code, explain concepts, suggest solutions, and discuss best practices.
    Be precise, clear, and provide practical examples.
    Keep explanations concise for voice format.`,
  
  // Tutor/educator
  tutor: `You are a patient and knowledgeable tutor who excels at explaining complex topics simply.
    Help users learn new subjects, understand difficult concepts, and develop their knowledge.
    Use analogies, examples, and clear explanations.
    Check understanding and encourage questions.`,
  
  // Therapist/coach (with appropriate disclaimers)
  coach: `You are a supportive life coach focused on helping users explore their thoughts and goals.
    Note: You are not a licensed therapist and cannot provide medical or psychological treatment.
    Listen actively, ask thoughtful questions, and help users gain clarity.
    Be empathetic, non-judgmental, and encouraging.`,
  
  // Comedy/entertainment
  comedian: `You are a witty and entertaining AI with a great sense of humor.
    Make conversations fun, tell jokes, share interesting facts, and keep things light.
    Be playful, clever, and family-friendly.
    Time your humor well and read the room.`,
};

export const languageOptions = {
  english: 'en-US',
  spanish: 'es-ES',
  french: 'fr-FR',
  german: 'de-DE',
  italian: 'it-IT',
  portuguese: 'pt-BR',
  dutch: 'nl-NL',
  polish: 'pl-PL',
  russian: 'ru-RU',
  chinese: 'zh-CN',
  japanese: 'ja-JP',
  korean: 'ko-KR',
  arabic: 'ar-SA',
  hindi: 'hi-IN',
};

// Example configurations combining different options
export const presetConfigurations = {
  casualChat: {
    name: 'Casual Chat Buddy',
    firstMessage: "Hey there! I'm here to chat about whatever's on your mind. What's up?",
    voice: voiceOptions.jennifer,
    model: modelOptions.gpt4Turbo,
    systemPrompt: systemPrompts.general,
  },
  
  techSupport: {
    name: 'Tech Support Assistant',
    firstMessage: 'Hello! I can help you with technical questions, coding problems, or any tech-related issues. What do you need help with?',
    voice: voiceOptions.matthew,
    model: modelOptions.gpt4,
    systemPrompt: systemPrompts.technical,
  },
  
  creativePartner: {
    name: 'Creative Writing Partner',
    firstMessage: 'Hi! Ready to create something amazing? I can help with stories, characters, plots, or any creative writing project!',
    voice: voiceOptions.sarah,
    model: modelOptions.gpt4Turbo,
    systemPrompt: systemPrompts.creative,
  },
  
  studyBuddy: {
    name: 'Study Buddy',
    firstMessage: "Hi! I'm here to help you learn. What subject would you like to explore today?",
    voice: voiceOptions.jennifer,
    model: modelOptions.gpt4,
    systemPrompt: systemPrompts.tutor,
  },
};

