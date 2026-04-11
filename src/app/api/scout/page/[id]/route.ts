import { NextRequest, NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { ScoutPageDoc } from '@/lib/schema';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const { id } = await params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const db = await getUserDb(user.auth0Id);
    const collection = db.collection<ScoutPageDoc>('scout_pages');

    const page = await collection.findOne({ _id: new ObjectId(id) });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Return cleaned text and metadata (exclude large HTML and screenshot)
    const response = {
      id: page._id?.toString(),
      url: page.url,
      title: page.title,
      text: page.text,
      domain: page.domain,
      metaDescription: page.metaDescription,
      fetchedAt: page.fetchedAt,
      hasScreenshot: !!page.screenshot,
      error: page.error
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Scout page retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
