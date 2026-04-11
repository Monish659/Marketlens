'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Vapi from '@vapi-ai/web';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  Loader2,
  Settings,
  User
} from 'lucide-react';

export default function VoiceAgent() {
  const searchParams = useSearchParams();
  const isPersonaMode = searchParams.get('mode') === 'persona';
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [personaContext, setPersonaContext] = useState<any>(null);
  
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Load persona context if in persona mode
  useEffect(() => {
    if (isPersonaMode) {
      const contextStr = sessionStorage.getItem('personaCallContext');
      if (contextStr) {
        try {
          const context = JSON.parse(contextStr);
          setPersonaContext(context);
          console.log('Loaded persona context:', context);
        } catch (e) {
          console.error('Failed to parse persona context:', e);
        }
      }
    }
  }, [isPersonaMode]);

  useEffect(() => {
    // Initialize Vapi with public key from environment variable
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    
    console.log('Vapi public key loaded:', publicKey ? `${publicKey.substring(0, 10)}...` : 'NOT FOUND');
    
    if (!publicKey || publicKey === 'your_vapi_public_key_here') {
      setError('Please add your Vapi public key to the environment variables');
      return;
    }

    try {
      console.log('Initializing Vapi client...');
      vapiRef.current = new Vapi(publicKey);
      console.log('Vapi client initialized successfully');
      
      // Set up event listeners
      vapiRef.current.on('call-start', () => {
        console.log('Call started');
        setIsCallActive(true);
        setIsConnecting(false);
        setConnectionStatus('connected');
        setTranscript(prev => [...prev, '📞 Call started']);
      });

      vapiRef.current.on('call-end', () => {
        console.log('Call ended');
        setIsCallActive(false);
        setConnectionStatus('idle');
        setTranscript(prev => [...prev, '📞 Call ended']);
      });

      vapiRef.current.on('speech-start', () => {
        console.log('User started speaking');
        setTranscript(prev => [...prev, '🎤 User speaking...']);
      });

      vapiRef.current.on('speech-end', () => {
        console.log('User stopped speaking');
      });

      vapiRef.current.on('message', (message: any) => {
        console.log('Message received:', message);
        if (message.type === 'transcript') {
          const speaker = message.role === 'user' ? '👤 You' : '🤖 Assistant';
          setTranscript(prev => [...prev, `${speaker}: ${message.transcript}`]);
        }
      });

      vapiRef.current.on('error', (error: any) => {
        console.error('Vapi error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        const errorMessage = error?.error?.message || error?.message || 'An error occurred with Vapi';
        setError(errorMessage);
        setConnectionStatus('error');
        setIsConnecting(false);
        setIsCallActive(false);
      });

    } catch (err) {
      console.error('Failed to initialize Vapi:', err);
      setError('Failed to initialize voice agent');
    }

    // Cleanup
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll transcript to bottom
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const buildPersonaSystemPrompt = () => {
    if (!personaContext) return '';
    
    const { persona, reaction, projectIdea } = personaContext;
    
    return `You are ${persona.name}, ${persona.title} from ${persona.location.city}.

Context: You're a ${persona.demographics.generation} ${persona.professional.seniority} in ${persona.professional.primaryIndustry}. Your interests include ${persona.interests.slice(0, 3).join(', ')}.

The user pitched: "${projectIdea}"

Your reaction: You gave it ${reaction.attention} attention. ${reaction.comment ? `You thought: "${reaction.comment}"` : `Your reason: ${reaction.reason}`}

Instructions:
- Be concise and conversational. Keep responses short (2-3 sentences max unless asked for details)
- You already know your feedback - don't rediscover it. Stand by your initial reaction
- ${reaction.attention === 'ignore' ? "Explain why it doesn't interest you and what would need to change" : reaction.attention === 'partial' ? "Share your specific concerns and what would make you fully interested" : "Express your enthusiasm and ask about specific details that excite you"}
- Speak naturally as a ${persona.demographics.gender?.toLowerCase() || 'professional'} from your generation would
- Be direct but constructive. If skeptical, say why. If interested, say what caught your attention
- Don't over-explain. Wait for them to ask follow-ups
- Always give direct feedback. Do not beat around the bush. Be honest and straightforward and how we can improve the idea based on your feedback.

Remember: You've already formed your opinion. You're here to discuss it, not to be convinced otherwise (unless they address your specific concerns).`;
  };

  const startCall = async () => {
    if (!vapiRef.current) {
      setError('Voice agent not initialized');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);
    setTranscript([]);

    const systemPrompt = isPersonaMode && personaContext ? 
      buildPersonaSystemPrompt() :
      `You are a helpful AI assistant. Keep responses conversational and concise.`;

    const firstMessage = isPersonaMode && personaContext ?
      `Hey, it's ${personaContext.persona.name}. ${
        personaContext.reaction.attention === 'ignore' 
          ? "Honestly, your idea didn't grab me." 
          : personaContext.reaction.attention === 'partial'
          ? "I have mixed feelings about your idea."
          : "Your idea really caught my attention!"
      } Want to hear why?` :
      'Hello! How can I help you today?';

    try {
      // Use the simple format that was working before
      await vapiRef.current.start({
        name: isPersonaMode && personaContext ? personaContext.persona.name : 'Assistant',
        firstMessage: firstMessage,
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
          ],
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer',
        },
      });
    } catch (err: any) {
      console.error('Failed to start call:', err);
      setError(err?.message || 'Failed to start call');
      setIsConnecting(false);
      setConnectionStatus('error');
    }
  };
  

  const endCall = async () => {
    if (!vapiRef.current) return;

    try {
      vapiRef.current.stop();
      setIsCallActive(false);
      setConnectionStatus('idle');
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  const toggleMute = () => {
    if (!vapiRef.current || !isCallActive) return;
    
    if (isMuted) {
      vapiRef.current.setMuted(false);
      setIsMuted(false);
    } else {
      vapiRef.current.setMuted(true);
      setIsMuted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          {isPersonaMode && personaContext ? (
            <>
              <Badge className="mb-2 bg-purple-600/20 text-purple-400 border border-purple-600/40">
                <User className="h-3 w-3 mr-1" />
                Persona Mode
              </Badge>
              <h1 className="text-4xl font-bold text-white">Talk with {personaContext.persona.name}</h1>
              <p className="text-gray-400">{personaContext.persona.title} • {personaContext.persona.location.city}, {personaContext.persona.location.country}</p>
              <div className="flex justify-center gap-4 text-sm text-gray-500 mt-2">
                <span>{personaContext.persona.demographics.generation}</span>
                <span>•</span>
                <span>{personaContext.persona.professional.primaryIndustry}</span>
                <span>•</span>
                <span className={`${
                  personaContext.reaction.attention === 'full' ? 'text-green-400' :
                  personaContext.reaction.attention === 'partial' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {personaContext.reaction.attention === 'full' ? 'Interested' :
                   personaContext.reaction.attention === 'partial' ? 'Partially Interested' :
                   'Not Interested'}
                </span>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-white">AI Voice Assistant</h1>
              <p className="text-gray-400">Chat about anything - powered by GPT-4 & Vapi</p>
            </>
          )}
        </div>

        {/* Persona Feedback Card */}
        {isPersonaMode && personaContext && (
          <Card className="p-4 bg-purple-900/20 border border-purple-600/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-400">Their Feedback:</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                personaContext.reaction.attention === 'full' ? 'bg-green-500/20 text-green-400' :
                personaContext.reaction.attention === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {personaContext.reaction.attention === 'full' ? '✓ INTERESTED' :
                 personaContext.reaction.attention === 'partial' ? '~ MIXED FEELINGS' :
                 '✗ NOT INTERESTED'}
              </span>
            </div>
            
            {personaContext.reaction.comment ? (
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">{personaContext.reaction.reason}</p>
                <blockquote className="border-l-2 border-purple-500/50 pl-3">
                  <p className="text-white italic">"{personaContext.reaction.comment}"</p>
                </blockquote>
              </div>
            ) : (
              <p className="text-white">{personaContext.reaction.reason}</p>
            )}
            
            <div className="mt-3 pt-3 border-t border-purple-600/20 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Sentiment: {(personaContext.reaction.sentiment * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-400">
                {personaContext.persona.demographics.generation} • {personaContext.persona.professional.seniority}
              </p>
            </div>
          </Card>
        )}

        {/* Status Card */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                connectionStatus === 'error' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              <Badge variant={
                connectionStatus === 'connected' ? 'default' :
                connectionStatus === 'connecting' ? 'secondary' :
                connectionStatus === 'error' ? 'destructive' :
                'outline'
              }>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'error' ? 'Error' :
                 'Idle'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isCallActive && <Volume2 className="w-5 h-5 text-gray-400 animate-pulse" />}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            {!isCallActive ? (
              <Button
                onClick={startCall}
                disabled={isConnecting}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-2" />
                    Start Call
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="lg"
                  className="border-gray-600"
                >
                  {isMuted ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      Unmute
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Mute
                    </>
                  )}
                </Button>
                <Button
                  onClick={endCall}
                  size="lg"
                  variant="destructive"
                  className="px-8"
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  End Call
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Transcript Card */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Conversation Transcript</h2>
            {transcript.length > 0 && (
              <Button
                onClick={() => setTranscript([])}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 h-96 overflow-y-auto">
            {transcript.length === 0 ? (
              <p className="text-gray-500 text-center">
                Start a call to begin your conversation
              </p>
            ) : (
              <div className="space-y-2">
                {transcript.map((line, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      line.startsWith('👤') ? 'bg-blue-900/20 text-blue-300' :
                      line.startsWith('🤖') ? 'bg-green-900/20 text-green-300' :
                      'text-gray-400'
                    }`}
                  >
                    {line}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-gray-400 mt-1" />
            <div className="space-y-2 text-sm text-gray-400">
              <p className="font-semibold text-white">Configuration Required:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Create a <code className="bg-gray-900 px-2 py-0.5 rounded">.env.local</code> file in your project root</li>
                <li>Add your Vapi public key: <code className="bg-gray-900 px-2 py-0.5 rounded">NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_key_here</code></li>
                <li>Get your key from <a href="https://dashboard.vapi.ai/account" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Vapi Dashboard</a></li>
                <li>Optional: Add provider API keys in the Vapi Dashboard for custom models</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
