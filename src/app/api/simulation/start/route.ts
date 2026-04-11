import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Simulation from '@/models/Simulation';
import Persona from '@/models/Persona';
import User from '@/models/User';
import { analyzePost } from '@/lib/ai/cohere';
import { generatePersonaOpinion } from '@/lib/ai/martian';
import { generateInsights } from '@/lib/ai/insights';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request (you'll need to implement auth middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postContent, projectId, platform, nichePersonaIds } = await request.json();

    if (!postContent || postContent.trim().length < 10) {
      return NextResponse.json(
        { error: 'Post content must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check or create user
    let user = await User.findOne({ auth0Id: userId });
    if (!user) {
      // Create new user with default credits
      user = new User({
        auth0Id: userId,
        email: `${userId}@example.com`, // You might want to get actual email from Auth0
        credits: 50, // Give new users 50 free credits
        subscription: 'free'
      });
      await user.save();
    }
    
    // Check if user has credits
    if (user.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Create new simulation
    const simulation = new Simulation({
      userId,
      projectId,
      postContent,
      platform: platform || 'product',
      status: 'processing',
      createdAt: new Date(),
      reactions: [],
      metrics: {
        score: 0,
        fullAttention: 0,
        partialAttention: 0,
        ignored: 0,
        viralCoefficient: 0,
        avgSentiment: 0,
        totalResponses: 0
      },
      cost: {
        cohere: 0,
        martian: 0,
        cerebras: 0,
        total: 0
      }
    });

    await simulation.save();

    // Start async processing
    processSimulation(simulation._id.toString(), postContent, userId, platform || 'product', nichePersonaIds);

    return NextResponse.json({
      success: true,
      simulationId: simulation._id,
      message: 'Simulation started successfully'
    });

  } catch (error: any) {
    console.error('Simulation start error:', error);
    return NextResponse.json(
      { error: 'Failed to start simulation' },
      { status: 500 }
    );
  }
}

async function processSimulation(simulationId: string, postContent: string, userId: string, platform: string, nichePersonaIds?: number[]) {
  try {
    await connectToDatabase();
    
    // Step 1: Analyze the post with Cohere
    console.log(`Analyzing ${platform} post...`);
    const postAnalysis = await analyzePost(postContent, platform);
    
    // Update simulation with analysis
    await Simulation.findByIdAndUpdate(simulationId, {
      postAnalysis,
      'cost.cohere': 0.02 // Example cost
    });

    // Step 2: Get personas (either niche-specific or all)
    let personas;
    if (nichePersonaIds && nichePersonaIds.length > 0) {
      // Use only the niche personas
      personas = await Persona.find({ personaId: { $in: nichePersonaIds } }).lean();
      console.log(`Processing ${personas.length} niche personas...`);
    } else {
      // Use all personas
      personas = await Persona.find({}).lean();
      console.log(`Processing ${personas.length} personas...`);
    }

    // Step 3: Generate opinions for each persona
    const reactions = [];
    let totalCost = 0.02; // Start with Cohere cost

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < personas.length; i += batchSize) {
      const batch = personas.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (persona) => {
        try {
          const opinion = await generatePersonaOpinion(
            persona as any, // Type assertion for lean() results
            postContent,
            postAnalysis,
            platform
          );
          
          return {
            personaId: persona.personaId,
            attention: opinion.attention,
            reason: opinion.reason,
            comment: opinion.comment,
            sentiment: opinion.sentiment,
            timestamp: new Date()
          };
        } catch (error) {
          console.error(`Error processing persona ${persona.personaId}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(r => r !== null);
      reactions.push(...validResults);

      // Update simulation with batch results
      for (const reaction of validResults) {
        await Simulation.findByIdAndUpdate(
          simulationId,
          {
            $push: { reactions: reaction },
            $inc: {
              [`metrics.${reaction.attention}`]: 1,
              'metrics.totalResponses': 1,
              'metrics.score': reaction.attention === 'full' ? 2 : 
                             reaction.attention === 'partial' ? 1 : 0,
              'cost.martian': 0.001, // Example cost per persona
              'cost.total': 0.001
            }
          }
        );
      }

      // Send real-time update (you'll implement WebSocket later)
      // await broadcastUpdate(simulationId, validResults);
    }

    // Step 4: Calculate final metrics
    const fullCount = reactions.filter(r => r.attention === 'full').length;
    const partialCount = reactions.filter(r => r.attention === 'partial').length;
    const ignoredCount = reactions.filter(r => r.attention === 'ignore').length;
    const avgSentiment = reactions.reduce((sum, r) => sum + r.sentiment, 0) / reactions.length;
    const viralCoefficient = (fullCount * 2 + partialCount) / (reactions.length * 2);
    
    // Calculate score as a weighted average (full = 2 points, partial = 1 point)
    const score = fullCount * 2 + partialCount;

    // Step 5: Generate insights with Cohere
    console.log('Generating insights...');
    const insights = await generateInsights(reactions, personas as any, postAnalysis);

    // Step 6: Update simulation with final results
    await Simulation.findByIdAndUpdate(
      simulationId,
      {
        status: 'completed',
        completedAt: new Date(),
        insights,
        'metrics.score': score,
        'metrics.fullAttention': fullCount,
        'metrics.partialAttention': partialCount,
        'metrics.ignored': ignoredCount,
        'metrics.totalResponses': reactions.length,
        'metrics.avgSentiment': avgSentiment,
        'metrics.viralCoefficient': viralCoefficient,
        $inc: {
          'cost.cohere': 0.04, // Additional Cohere cost for insights
          'cost.total': 0.04
        }
      }
    );

    // Deduct credit from user
    await User.findOneAndUpdate(
      { auth0Id: userId },
      { $inc: { credits: -1 } }
    ).catch(err => {
      console.error('Error deducting credit:', err);
      // Continue even if credit deduction fails
    });

    console.log(`Simulation ${simulationId} completed successfully`);

  } catch (error) {
    console.error('Error processing simulation:', error);
    await Simulation.findByIdAndUpdate(
      simulationId,
      { 
        status: 'failed',
        completedAt: new Date()
      }
    );
  }
}
