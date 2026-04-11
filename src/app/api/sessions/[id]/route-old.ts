import { NextRequest, NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET /api/sessions/[id] - Get specific session
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
    
    const { id: sessionId } = await params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }
    
    // Get user-specific database
    const db = await getUserDb(user.auth0Id);
    const sessionsCollection = db.collection('analysis_sessions');
    
    // Find session and verify ownership
    const session = await sessionsCollection.findOne({ 
      _id: new ObjectId(sessionId), 
      userId: user.auth0Id 
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Update last accessed time
    await sessionsCollection.updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { lastAccessedAt: new Date() } }
    );
    
    return NextResponse.json({ 
      success: true, 
      session: {
        ...session,
        _id: session._id.toString(),
        projectId: session.projectId.toString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch session' 
    }, { status: 500 });
  }
}

// PUT /api/sessions/[id] - Update session
export async function PUT(
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
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }
    
    const body = await request.json();
    const { analysisState, uiState, sessionName } = body;
    
    // Get user-specific database
    const db = await getUserDb(user.auth0Id);
    const sessionsCollection = db.collection('analysis_sessions');
    
    const updateData: any = {
      updatedAt: new Date(),
      lastAccessedAt: new Date()
    };
    
    if (analysisState) updateData.analysisState = analysisState;
    if (uiState) updateData.uiState = uiState;
    if (sessionName) updateData.sessionName = sessionName;
    
    const result = await sessionsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), userId: user.auth0Id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      session: {
        ...result,
        _id: result._id.toString(),
        projectId: result.projectId.toString()
      }
    });
    
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ 
      error: 'Failed to update session' 
    }, { status: 500 });
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(
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
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }
    
    // Get user-specific database
    const db = await getUserDb(user.auth0Id);
    const sessionsCollection = db.collection('analysis_sessions');
    
    const result = await sessionsCollection.findOneAndDelete({ 
      _id: new ObjectId(id), 
      userId: user.auth0Id 
    });
    
    if (!result) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ 
      error: 'Failed to delete session' 
    }, { status: 500 });
  }
}
