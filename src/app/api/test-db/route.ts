import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    
    // Test creating a user
    const testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    // Test finding the user
    const foundUser = await User.findById(testUser._id);

    // Clean up - delete the test user
    await User.findByIdAndDelete(testUser._id);

    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      testResult: {
        created: testUser,
        found: foundUser,
      },
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'MongoDB connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const user = await User.create({
      email: body.email,
      name: body.name,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
