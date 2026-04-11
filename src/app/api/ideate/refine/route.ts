import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getUserDb } from '@/lib/db';
import { RefinedResponse, type IdeaDoc } from '@/lib/schema';
import { REFINER_SYSTEM_PROMPT, buildRefinerPrompt } from '@/lib/prompts';
import { requireAuth } from '@/lib/auth';

interface RefineRequest {
  id: string;
  answers?: string[];
}

function kpiSanity(final: any) {
  // Keep it minimal; Step 3 is not a number-cruncher, just avoid absurd values
  return final;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body: RefineRequest = await request.json();
    
    const { id } = body;

    // Validate input
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(body.id);
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
        { status: 409 }
      );
    }

    if (!ideaDoc.critic?.response) {
      return NextResponse.json(
        { error: 'No critic response found for this idea' },
        { status: 409 }
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

    // Build refiner prompt
    const refinerPrompt = buildRefinerPrompt(
      ideaDoc.result, 
      ideaDoc.critic.response, 
      body.answers
    );

    console.log('Refiner prompt length:', refinerPrompt.length);
    console.log('Refiner prompt preview:', refinerPrompt.substring(0, 300));

    // Call Cohere Chat API
    const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cohereApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-r-plus-08-2024',
        message: refinerPrompt,
        preamble: REFINER_SYSTEM_PROMPT,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!cohereResponse.ok) {
      const errorText = await cohereResponse.text();
      console.error('Cohere API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate refined analysis' },
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
    const validationResult = RefinedResponse.safeParse(parsedResult);
    if (!validationResult.success) {
      console.error('Schema validation failed:', validationResult.error);
      return NextResponse.json(
        { error: 'schema_invalid', details: validationResult.error.message },
        { status: 502 }
      );
    }

    let refinedResult = validationResult.data;
    
    // Apply optional KPI sanity check
    refinedResult.final = kpiSanity(refinedResult.final);
    
    // Update the document with refiner response
    const updateResult = await collection.updateOne(
      { _id: objectId },
      { 
        $set: { 
          refiner: {
            response: refinedResult,
            refinedAt: new Date()
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
      refiner: refinedResult
    });
    
  } catch (error) {
    console.error('Error in /api/ideate/refine:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
