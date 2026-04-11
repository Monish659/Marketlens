import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getUserDb } from '@/lib/db';
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
    
    // Fetch from user-specific MongoDB database
    const db = await getUserDb(user.auth0Id);
    const collection = db.collection('ideas');
    
    const document = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: document._id.toString(),
      idea: document.idea,
      result: document.result,
      createdAt: document.createdAt
    });
    
  } catch (error) {
    console.error('Error in /api/ideas/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}