import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddings } from '@/lib/cohere';

export async function POST(request: NextRequest) {
  try {
    const { texts, model, inputType } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'Texts array is required and must not be empty' },
        { status: 400 }
      );
    }

    const embeddings = await getEmbeddings(texts, {
      model,
      inputType,
    });

    return NextResponse.json({ embeddings });
  } catch (error) {
    console.error('Error in Cohere embeddings API:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}
