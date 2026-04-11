import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getUserDb } from '@/lib/db';
import { CritiqueResponse, type IdeaDoc } from '@/lib/schema';
import { CRITIC_SYSTEM_PROMPT, buildCriticPrompt } from '@/lib/prompts';
import { requireAuth } from '@/lib/auth';

interface CriticRequest {
  ideaId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body = await request.json();
    const { ideaId } = body;

    // Validate input
    if (!ideaId || typeof ideaId !== 'string') {
      return NextResponse.json(
        { error: 'ideaId must be a valid string' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(ideaId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Load the idea document from user-specific database
    const db = await getUserDb(user.auth0Id);
    const collection = db.collection<IdeaDoc>('ideas');
    
    const ideaDoc = await collection.findOne({ _id: objectId });
    if (!ideaDoc) {
      return NextResponse.json(
        { error: 'Idea document not found' },
        { status: 404 }
      );
    }

    if (!ideaDoc.result) {
      return NextResponse.json(
        { error: 'No advisor result found for this idea' },
        { status: 404 }
      );
    }

    // Get Cohere API key
    const cohereApiKey = process.env.COHERE_API_KEY;
    if (!cohereApiKey) {
      return NextResponse.json(
        { error: 'Cohere API key not configured' },
        { status: 500 }
      );
    }

    // Build critic prompt
    const criticPrompt = buildCriticPrompt(ideaDoc.result);

    console.log('Critic prompt length:', criticPrompt.length);
    console.log('Critic prompt preview:', criticPrompt.substring(0, 300));

    // Call Cohere Chat API
    const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cohereApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-r-plus-08-2024',
        message: criticPrompt,
        preamble: CRITIC_SYSTEM_PROMPT,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!cohereResponse.ok) {
      const errorText = await cohereResponse.text();
      console.error('Cohere API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate critique analysis' },
        { status: 502 }
      );
    }

    const cohereData = await cohereResponse.json();
    
    // Extract text content from Cohere response
    let responseText: string;
    if (typeof cohereData.text === 'string') {
      responseText = cohereData.text;
    } else if (cohereData.message?.content) {
      responseText = cohereData.message.content;
    } else {
      console.error('Unexpected Cohere response format:', cohereData);
      return NextResponse.json(
        { error: 'Invalid response format from AI service' },
        { status: 502 }
      );
    }

    // Parse and validate JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON from Cohere:', parseError);
      return NextResponse.json(
        { error: 'schema_invalid', details: 'Response was not valid JSON' },
        { status: 502 }
      );
    }

    // Validate with Zod schema
    const validationResult = CritiqueResponse.safeParse(parsedResult);
    if (!validationResult.success) {
      console.error('Schema validation failed:', validationResult.error);
      return NextResponse.json(
        { error: 'schema_invalid', details: validationResult.error.message },
        { status: 502 }
      );
    }

    const critiqueResult = validationResult.data;
    
    // Update the document with critic response
    const updateResult = await collection.updateOne(
      { _id: objectId },
      { 
        $set: { 
          critic: {
            response: critiqueResult,
            critiquedAt: new Date()
          }
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      id: body.id,
      critic: critiqueResult
    });
    
  } catch (error) {
    console.error('Error in /api/ideate/critic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
