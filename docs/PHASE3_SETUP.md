# MarketLens Phase 3 - Setup Guide

## Overview
Phase 3 implements a global market simulation where 100 AI personas react to your product launch post in real-time.

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in the root directory with the following:

```env
# MongoDB Atlas (Required)
MONGODB_URI=mongodb+srv://cluster.mongodb.net/marketlens-db?retryWrites=true&w=majority

# Auth0 (Already configured)
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_DOMAIN=your-domain.auth0.com

# AI Services (Required for simulation)
COHERE_API_KEY=your_cohere_api_key
# Martian and Cerebras can be added later
# MARTIAN_API_KEY=your_martian_api_key
# CEREBRAS_API_KEY=your_cerebras_api_key
```

### 2. MongoDB Setup
1. Create a MongoDB Atlas cluster at https://cloud.mongodb.com
2. Create a database called `marketlens-db`
3. Get your connection string and add it to `.env.local`

### 3. Seed the Database with Personas
```bash
npm run seed
```
This will populate your database with 100 diverse personas from around the world.

### 4. Run the Application
```bash
npm run dev
```

## Features Implemented

### ✅ Completed
- **MongoDB Models**: Personas, Simulations, Projects, Users
- **100 Diverse Personas**: 35 US, 25 Europe, 20 Asia-Pacific, 20 Other regions
- **API Endpoints**: 
  - `/api/simulation/start` - Start a new simulation
  - `/api/simulation/[id]` - Get simulation results
  - `/api/personas` - Get all personas
- **AI Integration**:
  - Cohere for post analysis and insights
  - Simulated Martian routing (ready for real integration)
- **Interactive World Map**: D3.js visualization showing persona locations
- **Real-time Updates**: Reactions appear on map as they're generated
- **Metrics Dashboard**: Engagement scores, viral coefficient, sentiment
- **Launch Post Interface**: Modal for entering product launch posts
- **Persona Details**: Click personas on map to see details

### 🚧 To Complete
- **WebSocket Integration**: Real Pusher/Socket.io for live updates
- **Cost Tracking Display**: Show actual API costs
- **Martian/Cerebras Integration**: Connect real APIs when keys available

## How It Works

1. **Write Launch Post**: User writes a product launch post (like for Product Hunt)
2. **AI Analysis**: Cohere analyzes the post to understand product category, target audience, value props
3. **Persona Reactions**: Each of 100 personas evaluates the post based on their characteristics
4. **Real-time Visualization**: Reactions appear on world map in real-time (green=engaged, yellow=partial, red=ignored)
5. **Insights Generation**: AI synthesizes all reactions into actionable insights

## Persona System

Each persona has:
- **Demographics**: Generation, gender, age range
- **Location**: City and country with exact coordinates
- **Professional**: Industry, seniority, company size, experience
- **Psychographics**: Tech adoption, risk tolerance, price sensitivity, influence score
- **Personality**: Big 5 personality traits
- **Interests**: Relevant topics and technologies

## API Cost Optimization

The system uses smart routing to minimize costs:
- Executive personas → More sophisticated models
- Basic users → Simpler, cheaper models
- Influencers → Balanced models for nuanced responses

Estimated cost per simulation: ~$0.20-0.30 (vs $15,000 for traditional market research)

## Troubleshooting

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Check connection string format
- Verify database name matches

### Personas Not Loading
- Run `npm run seed` to populate database
- Check MongoDB connection in logs
- Verify personas collection exists

### Simulation Not Starting
- Check Auth0 authentication is working
- Ensure user has credits (default: 50)
- Check browser console for errors

## Next Steps

1. **Add Real AI Services**: Replace simulated responses with actual Martian/Cerebras APIs
2. **WebSocket Implementation**: Add Pusher for true real-time updates
3. **Enhanced Analytics**: Add demographic breakdowns, industry insights
4. **Export Features**: Allow users to export simulation results
5. **Sharing**: Create shareable links for simulation results

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Visualization**: D3.js, Three.js (globe)
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas with Mongoose
- **AI**: Cohere (implemented), Martian (ready), Cerebras (ready)
- **Auth**: Auth0

## Support
For issues or questions about Phase 3 implementation, check:
- Browser console for frontend errors
- Terminal for backend/API errors
- MongoDB Atlas logs for database issues
