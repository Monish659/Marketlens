import { NextResponse } from 'next/server';

const VAPI_API_BASE = 'https://api.vapi.ai';

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const privateKey = process.env.VAPI_PRIVATE_KEY;
  const assistantId =
    process.env.VAPI_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

  const env = {
    hasPublicKey: Boolean(publicKey),
    hasPrivateKey: Boolean(privateKey),
    hasAssistantId: Boolean(assistantId),
  };

  if (!privateKey) {
    return NextResponse.json({
      success: false,
      env,
      network: { tested: false },
      message: 'Missing VAPI_PRIVATE_KEY',
    });
  }

  try {
    const response = await fetch(`${VAPI_API_BASE}/assistant`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${privateKey}`,
      },
      cache: 'no-store',
    });

    return NextResponse.json({
      success: response.ok,
      env,
      network: {
        tested: true,
        status: response.status,
        statusText: response.statusText,
      },
      message: response.ok
        ? 'Vapi reachable from server'
        : 'Vapi reachable but private key is invalid or unauthorized',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        env,
        network: {
          tested: true,
          status: 0,
          statusText: 'Network error',
        },
        message: 'Server could not reach api.vapi.ai',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
