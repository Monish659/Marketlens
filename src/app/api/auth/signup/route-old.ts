import { NextRequest, NextResponse } from 'next/server';
import { ManagementClient } from 'auth0';

const management = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_M2M_CLIENT_ID!,
  clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET!
});

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    try {
      const existingUsers = await management.users.getAll({ q: `email:"${email}"` });
      if (existingUsers.data.length > 0) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    } catch (error) {
      // If error is "user not found", that's good - we can create the user
      console.log('User not found, proceeding with creation');
    }

    // Create user
    const user = await management.users.create({
      connection: 'Username-Password-Authentication',
      email,
      password,
      name: name || email.split('@')[0],
      email_verified: false
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId: user.data.user_id
    });

  } catch (error: any) {
    console.error('Signup API Error:', error);
    
    let errorMessage = 'Failed to create user';
    if (error.message?.includes('password')) {
      errorMessage = 'Password does not meet requirements';
    } else if (error.message?.includes('email')) {
      errorMessage = 'Invalid email format';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
