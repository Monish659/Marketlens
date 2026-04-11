import { NextRequest, NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    // Get user-specific database
    const db = await getUserDb(user.auth0Id);
    const projectsCollection = db.collection('projects');
    const simulationsCollection = db.collection('simulations');

    // Fetch user's projects with simulation counts
    const projects = await projectsCollection.aggregate([
      {
        $lookup: {
          from: 'simulations',
          localField: '_id',
          foreignField: 'projectId',
          as: 'projectSimulations'
        }
      },
      {
        $addFields: {
          simulationCount: { $size: '$projectSimulations' },
          lastSimulation: {
            $max: '$projectSimulations.createdAt'
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          simulationCount: 1,
          lastSimulation: 1
        }
      },
      { $sort: { updatedAt: -1 } }
    ]).toArray();

    return NextResponse.json({ projects });

  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const { name, description } = await request.json();

    if (!name || name.trim().length < 1) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Get user-specific database
    const db = await getUserDb(user.auth0Id);
    const projectsCollection = db.collection('projects');

    const projectDoc = {
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await projectsCollection.insertOne(projectDoc);

    return NextResponse.json({
      success: true,
      project: {
        _id: result.insertedId,
        name: projectDoc.name,
        description: projectDoc.description,
        createdAt: projectDoc.createdAt,
        updatedAt: projectDoc.updatedAt,
        simulationCount: 0,
        lastSimulation: null
      }
    });

  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}