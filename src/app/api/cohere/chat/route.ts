import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/cohere';

export async function POST(request: NextRequest) {
  try {
    const { message, model, temperature, maxTokens } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await chatCompletion(message, {
      model,
      temperature,
      maxTokens,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in Cohere chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
