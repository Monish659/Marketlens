# API Integration Setup Guide

## 🚀 Quick Start

Create a `.env.local` file in the root directory with your API keys:

```bash
# MongoDB Atlas (Required)
MONGODB_URI=your_mongodb_connection_string_here

# AI APIs (At least one required for full functionality)
OPENAI_API_KEY=your_openai_api_key_here
COHERE_API_KEY=your_cohere_api_key_here
MARTIAN_API_KEY=your_martian_api_key_here

# Auth0 (Optional for authentication)
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

## 📝 Getting API Keys

### OpenAI API (Recommended for persona generation)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to `OPENAI_API_KEY` in your `.env.local`

### Cohere API (For post analysis and insights)
1. Sign up at https://cohere.com
2. Get your API key from the dashboard
3. Add it to `COHERE_API_KEY` in your `.env.local`

### Martian API (For smart LLM routing)
1. Sign up at https://withmartian.com
2. Get your API key
3. Add it to `MARTIAN_API_KEY` in your `.env.local`

### MongoDB Atlas
1. Create a free cluster at https://www.mongodb.com/atlas
2. Get your connection string
3. Add it to `MONGODB_URI` in your `.env.local`

## 🎯 How It Works

The system now uses **real AI APIs** to generate:

### 1. **Platform-Aware Reactions**
Each persona reacts differently based on the platform:
- **LinkedIn**: Professional, business-focused responses
- **Instagram**: Casual, visual-focused, emoji-rich
- **Twitter/X**: Brief, witty, shareable
- **TikTok**: Gen Z language, trend-focused
- **Email**: Formal, action-oriented

### 2. **Persona-Specific Responses**
The AI considers each persona's:
- Professional background (industry, seniority, company size)
- Demographics (generation, location, age)
- Psychographics (tech adoption, risk tolerance, price sensitivity)
- Personality traits (openness, conscientiousness, extraversion)

### 3. **Intelligent Routing**
Different personas use different AI models:
- **Executives (C-Level, VP)**: GPT-4 for nuanced thinking
- **Tech-savvy users**: Claude for balanced responses
- **General users**: GPT-3.5 for cost-effective generation

### 4. **Deep Insights**
Cohere analyzes all reactions to provide:
- Top engagement reasons by demographic
- Industry-specific reception
- Geographic hotspots
- Unexpected audience segments
- Viral potential scoring
- Actionable recommendations

## 💰 Cost Optimization

The system is designed to be cost-effective:
- **Batch processing**: Processes personas in groups of 10
- **Smart routing**: Uses cheaper models when appropriate
- **Caching**: Reuses analysis results
- **Fallback mode**: Works without APIs for testing

Typical costs per simulation:
- **With APIs**: ~$0.15-0.30 for 100 personas
- **Demo mode**: Free (simulated responses)

## 🧪 Testing Without APIs

The system works in demo mode without API keys:
1. Leave API keys blank or use placeholder values
2. The system will use enhanced simulation
3. Responses are still platform and persona-aware
4. Perfect for development and testing

## 🔄 Real-time Updates

For production, add Pusher credentials for real-time updates:
```bash
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=us2
```

## 📊 Example API Response

When using real APIs, each persona generates:

```json
{
  "attention": "full",
  "reason": "Directly relevant to my role as VP of Product at a 1000+ company",
  "comment": "This addresses exactly the challenge we're facing with user validation. Would love to discuss integration possibilities.",
  "sentiment": 0.85
}
```

## 🎯 Platform-Specific Examples

### LinkedIn Post
**Input**: "Launching our new AI validation platform..."
**Executive Response**: "Impressive approach to market validation. This could save significant resources in our product development cycle."

### Instagram Post
**Input**: "Check out our new product! 🚀"
**Millennial Response**: "Love this! 🔥 Saved for later, can't wait to try it out!"

### Twitter/X Post
**Input**: "We built AI that validates your startup idea in minutes"
**Tech Influencer Response**: "This is the way. RT'd for visibility. 🚀"

## 🚀 Start Simulating

1. Add your API keys to `.env.local`
2. Run `npm run dev`
3. Click "Create New Test"
4. Select a platform (LinkedIn, Instagram, etc.)
5. Enter your content
6. Watch 100 AI personas react in real-time!

The system now generates **truly unique, contextual responses** for each persona based on their characteristics and the platform context.
