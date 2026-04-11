import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Persona from '@/models/Persona';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const industry = searchParams.get('industry');
    const generation = searchParams.get('generation');
    
    // Build filter
    const filter: any = {};
    if (country) filter['location.country'] = country;
    if (industry) filter['professional.primaryIndustry'] = industry;
    if (generation) filter['demographics.generation'] = generation;
    
    // Get personas with selected fields for map display
    const personas = await Persona.find(filter)
      .select('personaId name title location demographics professional psychographics')
      .lean();
    
    return NextResponse.json({
      personas,
      total: personas.length
    });
    
  } catch (error: any) {
    console.error('Error fetching personas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    );
  }
}
