import type { NextRequest } from 'next/server';

const COHERE_API_KEY = process.env.COHERE_API_KEY || '';

if (!COHERE_API_KEY) {
  // Do not throw at import-time in Next serverless, but warn
  console.warn('COHERE_API_KEY is not set. Embedding and rerank will fail.');
}

const EMBED_MODEL = process.env.COHERE_EMBED_MODEL || 'embed-english-v3.0';
const RERANK_MODEL = process.env.COHERE_RERANK_MODEL || 'rerank-english-v3.0';

export async function embedTextCohereV4(
  text: string,
  inputType: 'search_document' | 'search_query' = 'search_document'
): Promise<number[]> {
  const res = await fetch('https://api.cohere.ai/v1/embed', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts: [text],
      model: EMBED_MODEL,
      input_type: inputType,
      truncate: 'END',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cohere embed error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const embedding = data.embeddings?.[0] as number[] | undefined;
  if (!embedding) throw new Error('No embedding returned from Cohere');
  return embedding;
}

export async function rerankCohere(query: string, texts: string[]): Promise<{ index: number; score: number }[]> {
  const res = await fetch('https://api.cohere.ai/v1/rerank', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      documents: texts.map((text) => ({ text })),
      model: RERANK_MODEL,
      top_n: texts.length,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cohere rerank error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  // Cohere returns [{index, relevance_score}]
  const results = (data.results || []).map((r: any) => ({ index: r.index as number, score: r.relevance_score as number }));
  return results;
}

export function chunkTextByLength(text: string, chunkSize = 3000, overlap = 200): { id: string; text: string }[] {
  // naive char-based chunker approximating ~500-800 tokens per chunk
  const chunks: { id: string; text: string }[] = [];
  let i = 0;
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const slice = text.slice(start, end);
    chunks.push({ id: `c${i}`, text: slice });
    i += 1;
    if (end === text.length) break;
    start = end - overlap; // overlap to keep continuity
    if (start < 0) start = 0;
  }
  return chunks;
}
