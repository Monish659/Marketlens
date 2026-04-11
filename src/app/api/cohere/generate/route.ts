import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/cohere';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, maxTokens, temperature } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await generateText(prompt, {
      model,
      maxTokens,
      temperature,
    });

    console.log('📊 [COHERE] API response:', response);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in Cohere generate API:', error);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    );
  }
}
