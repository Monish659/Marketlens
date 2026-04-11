import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Simulation from '@/models/Simulation';
import Persona from '@/models/Persona';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params; // Await params in Next.js 15
    const simulation = await Simulation.findById(id).lean() as any;
    
    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }
    
    // Get persona details for reactions
    const personaIds = simulation.reactions.map((r: any) => r.personaId);
    const personas = await Persona.find({ personaId: { $in: personaIds } }).lean();
    const personaMap = new Map(personas.map(p => [p.personaId, p]));
    
    // Enrich reactions with persona data
    const enrichedReactions = simulation.reactions.map((reaction: any) => {
      const persona = personaMap.get(reaction.personaId);
      return {
        ...reaction,
        persona: persona ? {
          name: persona.name,
          title: persona.title,
          location: persona.location,
          demographics: persona.demographics,
          professional: persona.professional
        } : null
      };
    });
    
    return NextResponse.json({
      ...simulation,
      reactions: enrichedReactions
    });
    
  } catch (error: any) {
    console.error('Error fetching simulation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulation' },
      { status: 500 }
    );
  }
}

// Stream endpoint for real-time updates
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { lastIndex = 0 } = await request.json();
    
    await connectToDatabase();
    
    const { id } = await params; // Await params in Next.js 15
    
    // Get new reactions since lastIndex
    const simulation = await Simulation.findById(id)
      .select('reactions status metrics')
      .lean() as any;
    
    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }
    
    const newReactions = simulation.reactions.slice(lastIndex);
    
    // Get persona details for new reactions
    if (newReactions.length > 0) {
      const personaIds = newReactions.map((r: any) => r.personaId);
      const personas = await Persona.find({ personaId: { $in: personaIds } }).lean();
      const personaMap = new Map(personas.map(p => [p.personaId, p]));
      
      const enrichedReactions = newReactions.map((reaction: any) => {
        const persona = personaMap.get(reaction.personaId);
        return {
          ...reaction,
          persona: persona ? {
            name: persona.name,
            title: persona.title,
            location: persona.location
          } : null
        };
      });
      
      return NextResponse.json({
        newReactions: enrichedReactions,
        totalReactions: simulation.reactions.length,
        status: simulation.status,
        metrics: simulation.metrics
      });
    }
    
    return NextResponse.json({
      newReactions: [],
      totalReactions: simulation.reactions.length,
      status: simulation.status,
      metrics: simulation.metrics
    });
    
  } catch (error: any) {
    console.error('Error streaming simulation updates:', error);
    return NextResponse.json(
      { error: 'Failed to get updates' },
      { status: 500 }
    );
  }
}