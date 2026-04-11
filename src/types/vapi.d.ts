// Type definitions for Vapi Web SDK
// This file provides basic type definitions for the Vapi SDK

declare module '@vapi-ai/web' {
  export interface VapiConfig {
    name: string;
    firstMessage?: string;
    transcriber?: {
      provider: 'deepgram' | 'assembly' | 'whisper';
      model?: string;
      language?: string;
    };
    voice?: {
      provider: 'playht' | 'elevenlabs' | '11labs' | 'azure' | 'rime';
      voiceId: string;
    };
    model?: {
      provider: 'openai' | 'anthropic' | 'together' | 'groq';
      model: string;
      messages?: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }>;
    };
  }

  export interface VapiMessage {
    type: string;
    role?: 'user' | 'assistant';
    transcript?: string;
    [key: string]: any;
  }

  export default class Vapi {
    constructor(publicKey: string);
    
    start(config: VapiConfig): Promise<void>;
    stop(): void;
    setMuted(muted: boolean): void;
    
    on(event: 'call-start', handler: () => void): void;
    on(event: 'call-end', handler: () => void): void;
    on(event: 'speech-start', handler: () => void): void;
    on(event: 'speech-end', handler: () => void): void;
    on(event: 'message', handler: (message: VapiMessage) => void): void;
    on(event: 'error', handler: (error: any) => void): void;
    on(event: string, handler: (...args: any[]) => void): void;
    
    off(event: string, handler?: (...args: any[]) => void): void;
  }
}

