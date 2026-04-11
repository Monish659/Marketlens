# Vapi Voice Agent Setup Guide

## Quick Start

Your Vapi voice agent is now set up at `/voice-agent`. To get it working, you need to add your API keys.

## 1. Get Your Vapi API Keys

1. Sign up for a Vapi account at [https://dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Navigate to your Account settings
3. Copy your **Public Key** (required for web SDK)
4. Optionally, copy your **Private Key** (for server-side features)

## 2. Configure Environment Variables

Create a `.env.local` file in your project root (`/Users/krish/Projects/marketlens/`) with the following:

```bash
# Required: Vapi Public Key for client-side SDK
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key_here

# Optional: Vapi Private Key for server-side features
VAPI_PRIVATE_KEY=your_vapi_private_key_here
```

## 3. Optional: Configure Provider Keys

You can add provider API keys either:

### Option A: In Vapi Dashboard (Recommended)
- Go to [Vapi Dashboard > Provider Keys](https://dashboard.vapi.ai/provider-keys)
- Add your OpenAI, Deepgram, PlayHT, or other provider keys
- This way, you're billed directly by the providers

### Option B: In Environment Variables
Add to your `.env.local`:
```bash
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
PLAYHT_API_KEY=your_playht_key
```

## 4. Test Your Voice Agent

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to [http://localhost:3000/voice-agent](http://localhost:3000/voice-agent)

3. Click "Start Call" to begin a conversation with your AI assistant

## Features Included

- ✅ General-purpose AI assistant (GPT-4 powered)
- ✅ Real-time voice conversation about ANY topic
- ✅ Live transcription display
- ✅ Mute/unmute functionality
- ✅ Connection status indicators
- ✅ Error handling
- ✅ Beautiful UI with dark mode

## Current Configuration

The voice agent is now configured as a **general-purpose AI assistant** that can:
- Answer questions on any topic
- Have philosophical discussions
- Help with creative tasks
- Provide technical assistance
- Offer advice and perspectives
- Discuss hobbies, entertainment, and culture
- Explain complex topics simply
- Be a conversational partner

## Customization Options

### Pre-built Configurations
Check `/src/config/voice-agent-options.ts` for ready-to-use configurations including:
- Casual Chat Buddy
- Tech Support Assistant
- Creative Writing Partner
- Study Buddy
- And more!

### Change the AI Model
```javascript
model: {
  provider: 'openai',
  model: 'gpt-4-turbo-preview',  // or 'gpt-4', 'gpt-3.5-turbo'
},
```

**Alternative AI Providers:**
- **Anthropic**: Claude 3 Opus/Sonnet
- **Together AI**: Mixtral, Llama 2
- **Groq**: Fast inference models

### Change the Voice
```javascript
voice: {
  provider: 'playht',
  voiceId: 'jennifer',  // or 'matthew', 'sarah', etc.
},
```

**Voice Providers:**
- **PlayHT**: Multiple natural voices
- **ElevenLabs**: Premium voices (requires API key)
- **Azure**: Microsoft voices
- **Rime**: Alternative voice provider

### Change the Language
```javascript
transcriber: {
  provider: 'deepgram',
  model: 'nova-2',
  language: 'en-US',  // or 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', etc.
},
```

### Customize the Personality
Edit the system prompt in `/src/components/voice-agent.tsx` to create any type of assistant:

```javascript
messages: [
  {
    role: 'system',
    content: `Your custom personality and instructions here...`
  }
]
```

### Example: Switch to a Different Preset
```javascript
import { presetConfigurations } from '@/config/voice-agent-options';

// In the startCall function, replace the config with:
await vapiRef.current.start({
  ...presetConfigurations.techSupport,  // or any other preset
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'en-US',
  },
});
```

## Troubleshooting

### "Please add your Vapi public key" Error
- Make sure you've created the `.env.local` file
- Ensure the key is correctly formatted (no extra spaces)
- Restart your development server after adding the key

### "Failed to start call" Error
- Check your Vapi dashboard for any account issues
- Ensure your provider keys are configured (if using custom providers)
- Check the browser console for detailed error messages

### No Audio
- Ensure your browser has microphone permissions
- Check your system audio settings
- Try using headphones to avoid echo

## Advanced Features

To add more advanced features, you can:

1. **Create custom assistants** in the Vapi Dashboard and use their IDs
2. **Add function calling** for the assistant to interact with your app
3. **Implement server-side token generation** for better security
4. **Add call recording** and analytics
5. **Create phone number integration** for inbound/outbound calls

## Resources

- [Vapi Documentation](https://docs.vapi.ai)
- [Vapi Dashboard](https://dashboard.vapi.ai)
- [Vapi Web SDK Reference](https://docs.vapi.ai/api-reference/vapi/start)
- [Example Configurations](https://docs.vapi.ai/examples)

## Support

For issues specific to this implementation, check the code in:
- `/src/components/voice-agent.tsx` - Main voice agent component
- `/src/app/voice-agent/page.tsx` - Voice agent page

For Vapi-specific issues, visit [Vapi Support](https://docs.vapi.ai/support)
