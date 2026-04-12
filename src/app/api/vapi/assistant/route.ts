import { NextRequest, NextResponse } from "next/server";
import { getVoiceProfile } from "@/lib/voice-profile";

const VAPI_API_BASE = "https://api.vapi.ai";

type CreateAssistantRequest = {
  name?: string;
  firstMessage?: string;
  systemPrompt?: string;
  persona?: {
    demographics?: { gender?: string };
    location?: { country?: string };
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as CreateAssistantRequest;

    // Prefer a pre-created assistant when provided.
    const staticAssistantId =
      process.env.VAPI_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    const allowDynamicPersonaAssistant = process.env.VAPI_DYNAMIC_ASSISTANT !== "false";
    const shouldUseStaticAssistant =
      Boolean(staticAssistantId) &&
      (!body.persona || !allowDynamicPersonaAssistant);

    if (shouldUseStaticAssistant && staticAssistantId) {
      return NextResponse.json({
        success: true,
        assistantId: staticAssistantId,
        source: "env",
      });
    }

    const privateKey = process.env.VAPI_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing VAPI_PRIVATE_KEY. Add it in Vercel Environment Variables or configure VAPI_ASSISTANT_ID.",
        },
        { status: 500 }
      );
    }

    const voiceProfile = getVoiceProfile({
      persona: body.persona,
    });

    const assistantPayload = {
      name: body.name || "MarketLens Persona Assistant",
      firstMessage: body.firstMessage || "Hi there. Tell me what you'd like feedback on.",
      firstMessageMode: "assistant-speaks-first",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              body.systemPrompt ||
              "You are a helpful, direct product feedback assistant. Be concise and practical.",
          },
        ],
      },
      voice: {
        provider: voiceProfile.provider,
        voiceId: voiceProfile.voiceId,
      },
      transcriber: voiceProfile.transcriber,
    };

    const response = await fetch(`${VAPI_API_BASE}/assistant`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assistantPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create Vapi assistant",
          details: data || response.statusText,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      assistantId: data?.id,
      source: "created",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error while creating Vapi assistant",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
