import { NextRequest, NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET /api/sessions - List all sessions for a project
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }
    
    // Validate ObjectId format
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // Get user-specific database
    const db = await getUserDb(user.auth0Id);
    const projectsCollection = db.collection('projects');
    const sessionsCollection = db.collection('analysis_sessions');
    
    // Verify project exists, create if it doesn't
    let project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      // Auto-create project for session management
      const projectDoc = {
        _id: new ObjectId(projectId),
        name: 'Analysis Project',
        description: 'Auto-created for session management',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await projectsCollection.insertOne(projectDoc);
      project = projectDoc;
    }
    
    // Get all sessions for this project
    const sessions = await sessionsCollection.find({ 
      projectId: new ObjectId(projectId)
    })
    .sort({ lastAccessedAt: -1 }) // Most recently accessed first
    .toArray();
    
    return NextResponse.json({ 
      success: true, 
      sessions: sessions.map(session => ({
        ...session,
        _id: session._id.toString(),
        projectId: session.projectId.toString()
      }))
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sessions' 
    }, { status: 500 });
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;
    
    const body = await request.json();
    const { projectId, prompt, analysisState, uiState, sessionName } = body;
    
    if (!projectId) {
      return NextResponse.json({ 
        error: 'Project ID is required' 
      }, { status: 400 });
    }
    
    // Validate ObjectId format
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // Get user-specific database
    const db = await getUserDb(user.auth0Id);
    const projectsCollection = db.collection('projects');
    const sessionsCollection = db.collection('analysis_sessions');
    
    // Verify project exists, create if it doesn't
    let project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      // Auto-create project for session management
      const projectDoc = {
        _id: new ObjectId(projectId),
        name: 'Analysis Project',
        description: 'Auto-created for session management',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await projectsCollection.insertOne(projectDoc);
      project = projectDoc;
    }
    
    // Generate session name if not provided
    const generatedSessionName = sessionName || generateSessionName(prompt);
    
    // Create new session document
    const sessionDoc = {
      projectId: new ObjectId(projectId),
      userId: user.auth0Id,
      sessionName: generatedSessionName,
      prompt,
      analysisState: analysisState || {
        niche: '',
        nicheExtracted: false,
        selectedUsers: [],
        opinions: [],
        metrics: {
          score: 0,
          totalResponses: 0,
          fullAttention: 0,
          partialAttention: 0,
          ignored: 0,
          viralCoefficient: 0,
          avgSentiment: 0
        },
        globeDots: [],
        reactions: [],
        insights: null,
        nicheInfo: null
      },
      uiState: uiState || {
        viewMode: 'global',
        simulationType: 'project-idea',
        currentSociety: 'Startup Investors',
        processedPersonas: 0,
        currentProcessingStep: ''
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date()
    };
    
    const result = await sessionsCollection.insertOne(sessionDoc);
    
    return NextResponse.json({ 
      success: true, 
      session: {
        ...sessionDoc,
        _id: result.insertedId.toString(),
        projectId: sessionDoc.projectId.toString()
      }
    });
    
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ 
      error: 'Failed to create session' 
    }, { status: 500 });
  }
}

// Helper function to generate session names
function generateSessionName(prompt: string): string {
  // Take first 50 characters of prompt and add timestamp
  const truncatedPrompt = prompt.length > 50 
    ? prompt.substring(0, 50) + '...' 
    : prompt;
  
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return `${truncatedPrompt} - ${timeString}`;
}
