# MarketLens
*AI agents for simulated market research*


An AI-powered market simulation platform that lets you test product ideas against hundreds of intelligent personas in real-time. Built for entrepreneurs, product managers, and researchers who want to validate ideas before launch.

Transform your product validation from months of surveys to minutes of AI-powered insights with realistic persona feedback, voice conversations, and iterative refinement.

## Live Demo

- **Vercel:** https://marketlens-brown.vercel.app

## Current UI (Live Vercel Screenshot)

![MarketLens live Vercel screenshot](public/vercel-screenshot.png)

## Core Features

### **3D Globe Visualization**
- Interactive Three.js globe with 200+ AI personas
- Real-time reaction visualization (green/yellow/red nodes)
- Geographic distribution of market interest
- Smooth animations and transitions with Framer Motion

### **Focus Group Selection**
- AI-powered niche identification using Cohere embeddings
- Semantic search to find relevant personas for your idea
- Smart reranking to select the most appropriate 5-person focus group
- Dynamic persona filtering based on industry, demographics, and interests

### **Intelligent Persona Reactions**
- AI-generated feedback using Cohere's Command-R-Plus model
- Realistic responses based on persona characteristics
- Sentiment analysis and attention scoring
- Contextual comments and feature suggestions

### **Voice Conversations**
- Real-time voice chat with personas using Vapi
- Dynamic voice selection based on persona demographics
- Contextual conversations about specific feedback
- WebRTC streaming with <100ms latency

### **Iterative Refinement**
- Collect negative/neutral feedback for analysis
- AI-powered idea refinement based on collected insights
- Re-run simulations with the same focus group
- Track improvement across iterations

### **Global Deployment**
- Scale from focus group to worldwide simulation
- Deploy refined ideas to all 200+ personas globally
- Comprehensive market penetration analysis
- Real-time global reaction mapping

## Technology Stack

### **Frontend Framework**
- **Next.js 15.5** - React framework with App Router
- **React 19** - Latest React features and optimizations
- **TypeScript** - Type-safe development throughout

### **Styling & UI**
- **Tailwind CSS** - Utility-first styling with custom design system
- **Framer Motion** - Smooth animations and transitions
- **Radix UI** - Accessible headless components
- **shadcn/ui** - Pre-built component library
- **Lucide React** - Beautiful icon library

### **3D Visualization**
- **Three.js** - WebGL-powered 3D graphics
- **React Three Fiber** - React renderer for Three.js
- **Custom shaders** - Optimized globe rendering with persona nodes

### **AI & Machine Learning**
- **Cohere AI** - Text generation, embeddings, and reranking
- **OpenAI** (via Martian) - Persona reaction generation
- **Vapi** - Real-time voice AI conversations
- **Semantic search** - Intelligent persona matching

### **Backend & Database**
- **Next.js API Routes** - Serverless backend functions
- **MongoDB Atlas** - Document database for personas and sessions
- **Mongoose** - MongoDB object modeling
- **Auth0** - User authentication and management

### **Infrastructure**
- **Vercel** - Deployment and hosting platform
- **Auth0 Management API** - Dynamic persona account creation
- **Session Storage** - Client-side state persistence

## Architecture Overview

### **Persona System**
MarketLens manages 200+ AI personas, each with:
- **Demographics**: Age, gender, generation, location
- **Professional**: Industry, seniority, company size, experience
- **Psychographics**: Tech adoption, risk tolerance, personality traits
- **Interests**: Industry-specific and personal interests
- **Behavioral patterns**: Response tendencies and preferences

### **AI Pipeline**
1. **Idea Analysis**: Cohere embeddings extract semantic meaning
2. **Persona Matching**: Reranking algorithm selects relevant personas
3. **Reaction Generation**: AI generates contextual responses
4. **Sentiment Analysis**: Structured feedback with attention scoring
5. **Voice Synthesis**: Dynamic voice selection and conversation

### **Real-time Features**
- **WebSocket connections** for live updates
- **Streaming responses** from AI models
- **Real-time voice** via WebRTC
- **Live reaction mapping** on 3D globe

## Development Setup

### **Prerequisites**
- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Auth0 account
- API keys for Cohere, OpenAI, and Vapi

### **Installation**

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd marketlens
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```

3. **Configure environment variables in `.env.local`:**
```env
# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_M2M_CLIENT_ID=your-m2m-client-id
AUTH0_M2M_CLIENT_SECRET=your-m2m-client-secret

# Database
MONGODB_URI=mongodb+srv://cluster.mongodb.net/marketlens?retryWrites=true&w=majority

# AI Services
COHERE_API_KEY=your-cohere-key
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key
VAPI_PRIVATE_KEY=your-vapi-private-key
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
```
http://localhost:3000
```

### **Development Commands**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## Project Structure

```
marketlens/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── cohere/       # Cohere AI integration
│   │   │   ├── generate-opinions/  # Persona reaction generation
│   │   │   ├── projects/     # Project management
│   │   │   ├── simulation/   # Simulation management
│   │   │   └── ...
│   │   ├── dashboard/        # Main dashboard page
│   │   ├── projects/         # Project selection page
│   │   ├── login/           # Authentication pages
│   │   └── ...
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components
│   │   ├── magicui/         # Custom animated components
│   │   ├── simulation-dashboard.tsx  # Main dashboard
│   │   ├── voice-agent.tsx  # Voice conversation interface
│   │   └── ...
│   ├── lib/                 # Utility libraries
│   │   ├── ai/             # AI service integrations
│   │   ├── auth.ts         # Authentication utilities
│   │   ├── db.ts           # Database connections
│   │   └── ...
│   ├── models/             # Database models
│   ├── types/              # TypeScript type definitions
│   └── ...
├── public/                 # Static assets
├── personas.json          # Persona dataset (200+ entries)
└── ...
```

## API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### **Projects**
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details

### **Simulation**
- `POST /api/simulation/start` - Start new simulation
- `GET /api/simulation/[id]` - Get simulation status
- `POST /api/generate-opinions` - Generate persona reactions

### **AI Services**
- `POST /api/cohere/generate` - Text generation
- `POST /api/cohere/embeddings` - Generate embeddings
- `POST /api/select-niche-users` - Find relevant personas

### **Voice**
- Voice conversations handled client-side via Vapi SDK

## Key Features Deep Dive

### **Focus Group Intelligence**
The system uses advanced semantic search to identify the most relevant personas:

1. **Idea Embedding**: Convert product idea to vector representation
2. **Persona Matching**: Compare against persona interest vectors
3. **Reranking**: Use Cohere's rerank API for precision
4. **Selection**: Choose top 5 most relevant personas

### **Realistic Reactions**
Each persona generates contextual feedback based on:
- Professional background and industry experience
- Demographic characteristics and generational preferences  
- Psychographic traits and personality scores
- Geographic location and cultural context
- Personal interests and behavioral patterns

### **Voice Conversations**
Dynamic voice selection algorithm:
- Male/female voices based on persona gender
- Age-appropriate voice characteristics
- Personality-matched speaking style
- Real-time conversation with full context

### **Iterative Improvement**
The refinement cycle:
1. Collect feedback from negative/neutral reactions
2. Analyze common themes and concerns
3. Generate improved product description
4. Re-test with same focus group
5. Compare before/after results

## Deployment

### **Vercel Deployment**
```bash
# Deploy to Vercel
vercel --prod

# Set environment variables
vercel env add AUTH0_DOMAIN production
vercel env add MONGODB_URI production
# ... add all required environment variables
```

### **Environment Configuration**
Ensure all environment variables are configured in your deployment platform:
- Authentication credentials (Auth0)
- Database connection (MongoDB Atlas)
- AI service API keys (Cohere, OpenAI, Vapi)
- Base URLs for production environment

## Usage Examples

### **Basic Workflow**
1. **Login** with Auth0 authentication
2. **Create Project** or select existing one
3. **Enter Product Idea** in the prompt bar
4. **Click "Focus Group"** to find relevant personas
5. **Review Reactions** on the 3D globe visualization
6. **Call Personas** to discuss their feedback
7. **Collect Feedback** from negative/neutral reactions
8. **Refine Idea** based on collected insights
9. **Deploy Globally** when satisfied with focus group results

### **Advanced Features**
- **Session Management**: Save and restore analysis sessions
- **Feedback Lists**: Organize personas by reaction type
- **Global Deployment**: Scale successful ideas worldwide
- **Voice Conversations**: Deep dive into specific concerns

## Performance Optimizations

### **Frontend**
- **Code splitting** with Next.js dynamic imports
- **Image optimization** with Next.js Image component
- **Bundle analysis** and tree shaking
- **Lazy loading** for non-critical components

### **Backend**
- **API route optimization** with edge functions
- **Database indexing** for fast persona queries
- **Caching strategies** for frequently accessed data
- **Rate limiting** for AI service calls

### **3D Rendering**
- **Efficient geometry** for globe and persona nodes
- **LOD (Level of Detail)** for distant objects
- **Frustum culling** to avoid rendering off-screen elements
- **Optimized shaders** for smooth animations

## Security Considerations

### **Authentication**
- **Auth0 integration** with secure token handling
- **User isolation** with tenant-specific data
- **Session management** with secure storage

### **API Security**
- **Rate limiting** on all endpoints
- **Input validation** and sanitization
- **CORS configuration** for cross-origin requests
- **Environment variable** protection

### **Data Privacy**
- **User data isolation** per Auth0 tenant
- **Secure persona storage** with encryption
- **No PII exposure** in client-side code

## Contributing

We welcome contributions to improve MarketLens's capabilities:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with proper TypeScript types
4. **Test thoroughly** across different scenarios
5. **Submit a pull request** with detailed description

### **Development Guidelines**
- Follow TypeScript strict mode
- Use Tailwind CSS for styling consistency
- Implement proper error handling
- Add comprehensive logging for debugging
- Test with multiple persona types

## License

This project is proprietary software. All rights reserved.

## Support

For support, feature requests, or bug reports, please contact the development team.

---

*MarketLens - Because your next billion-dollar idea deserves more than a guess.*
