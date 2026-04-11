import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use Auth0's Authentication API with Regular Web Application
    const authResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
        username: email,
        password: password,
        client_id: process.env.AUTH0_CLIENT_ID!,
        client_secret: process.env.AUTH0_CLIENT_SECRET!,
        realm: 'Username-Password-Authentication',
        scope: 'openid profile email'
      }),
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      console.error('Auth0 login error:', authData);
      console.error('Response status:', authResponse.status);
      console.error('Full error details:', JSON.stringify(authData, null, 2));
      
      let errorMessage = 'Invalid email or password';
      if (authData.error === 'invalid_grant') {
        errorMessage = 'Invalid email or password';
      } else if (authData.error === 'unauthorized') {
        errorMessage = 'Account not found or password incorrect';
      } else if (authData.error === 'access_denied') {
        errorMessage = 'Access denied. Please check your Auth0 configuration.';
      } else if (authData.error_description) {
        errorMessage = authData.error_description;
      }
      
      return NextResponse.json(
        { error: errorMessage, details: authData },
        { status: 401 }
      );
    }

    // Get user profile
    const userResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    return NextResponse.json({
      success: true,
      user: userData,
      tokens: {
        access_token: authData.access_token,
        id_token: authData.id_token,
        refresh_token: authData.refresh_token,
        expires_in: authData.expires_in
      }
    });

  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
