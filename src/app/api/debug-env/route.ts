import { NextResponse } from 'next/server';

export async function GET() {
  const mongoUri = process.env.MONGODB_URI;
  
  return NextResponse.json({
    hasMongoUri: !!mongoUri,
    uriLength: mongoUri?.length || 0,
    uriStart: mongoUri?.substring(0, 20) || 'Not found',
    // Don't log the full URI for security
  });
}
