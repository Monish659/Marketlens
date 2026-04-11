import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractUserFromHeaders } from '@/lib/auth-adapter';

const PersonaResponseSchema = z.object({
  name: z.string().min(1).max(120),
  attention: z.enum(['full', 'partial', 'ignore']),
  reason: z.string().max(1000).optional().default(''),
  comment: z.string().max(1000).optional().default(''),
  title: z.string().max(120).optional(),
});

const SessionContextSchema = z.object({
  idea: z.string().max(4000).optional().default(''),
  sentimentDistribution: z
    .object({
      full: z.number().min(0).default(0),
      partial: z.number().min(0).default(0),
      ignore: z.number().min(0).default(0),
      total: z.number().min(0).default(0),
    })
    .optional(),
  topObjections: z.array(z.string().min(1).max(500)).max(20).default([]),
  personaResponses: z.array(PersonaResponseSchema).max(60).default([]),
});

const ExplainRequestSchema = z.object({
  question: z.string().min(2).max(500),
  sessionContext: SessionContextSchema,
});

const ExplainResponseSchema = z.object({
  answer: z.string(),
  evidence: z.array(z.string()),
  suggestedActions: z.array(z.string()),
});

function topReasons(personaResponses: z.infer<typeof PersonaResponseSchema>[], limit = 5) {
  const counts = new Map<string, number>();
  for (const persona of personaResponses) {
    const text = (persona.comment || persona.reason || '').trim();
    if (!text) continue;
    counts.set(text, (counts.get(text) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([text]) => text);
}

function inferActions(objections: string[], idea: string) {
  const actions: string[] = [];
  const joined = objections.join(' ').toLowerCase();

  if (joined.includes('price') || joined.includes('cost')) {
    actions.push('Add a clear pricing model with one low-risk entry tier.');
  }
  if (joined.includes('unclear') || joined.includes('clarity') || joined.includes('confusing')) {
    actions.push('Rewrite the pitch in one sentence: problem, user, and measurable outcome.');
  }
  if (joined.includes('security') || joined.includes('privacy')) {
    actions.push('Add a privacy and security section with concrete safeguards.');
  }
  if (joined.includes('proof') || joined.includes('evidence') || joined.includes('data')) {
    actions.push('Include proof points from a pilot, benchmark, or before/after metric.');
  }
  if (joined.includes('integration') || joined.includes('workflow')) {
    actions.push('Show exactly how this fits into an existing workflow in 3 steps.');
  }
  if (actions.length === 0) {
    actions.push('Address the top objections directly in the first 3 lines of your pitch.');
    actions.push('Add one concrete use case and one expected outcome metric.');
  }
  if (idea.trim().length > 0) {
    actions.push('Keep the core idea intent unchanged, but tighten positioning and practical rollout details.');
  }
  return actions.slice(0, 4);
}

export async function POST(request: NextRequest) {
  try {
    const user = extractUserFromHeaders(request);
    if (!user.email && !user.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const parsedBody = ExplainRequestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { question, sessionContext } = parsedBody.data;
    const personaResponses = sessionContext.personaResponses;
    const objections = sessionContext.topObjections.length
      ? sessionContext.topObjections
      : topReasons(personaResponses, 6);

    const full = sessionContext.sentimentDistribution?.full || 0;
    const partial = sessionContext.sentimentDistribution?.partial || 0;
    const ignore = sessionContext.sentimentDistribution?.ignore || 0;
    const total =
      sessionContext.sentimentDistribution?.total ||
      Math.max(personaResponses.length, full + partial + ignore);

    const q = question.toLowerCase();

    let answer = '';
    if (q.includes('why') && (q.includes('reject') || q.includes('no') || q.includes('ignore'))) {
      answer = objections.length
        ? `Personas rejected this mainly because: ${objections.slice(0, 3).join(' | ')}. The strongest negative signal is ${ignore}/${total} ignore responses, which indicates a relevance and clarity gap.`
        : `There is rejection in the current run (${ignore}/${total} ignore), but no explicit objection text was captured.`;
    } else if (q.includes('pattern') || q.includes('trend')) {
      answer = `Detected pattern: ${full}/${total} full attention, ${partial}/${total} partial attention, and ${ignore}/${total} ignore. The dominant qualitative pattern is "${objections[0] || 'insufficient explicit differentiation'}".`;
    } else if (q.includes('improve') || q.includes('better') || q.includes('fix')) {
      const actions = inferActions(objections, sessionContext.idea);
      answer = `To improve this idea while preserving intent, prioritize: ${actions.join(' ')}`;
    } else {
      answer = `Based on this session only: attention is ${full}/${total} full, ${partial}/${total} partial, ${ignore}/${total} ignore. Main objections are ${objections.slice(0, 2).join(' | ') || 'not enough captured evidence yet'}.`;
    }

    const responsePayload = ExplainResponseSchema.parse({
      answer,
      evidence: objections.slice(0, 5),
      suggestedActions: inferActions(objections, sessionContext.idea),
    });

    return NextResponse.json({ success: true, ...responsePayload });
  } catch (error) {
    console.error('Error in /api/chat/explain:', error);
    return NextResponse.json(
      {
        error: 'Failed to explain analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

