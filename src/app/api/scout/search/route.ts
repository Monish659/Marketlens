import { NextRequest, NextResponse } from 'next/server';
import { getUserDb } from '@/lib/db';
import { rerankCohere, embedTextCohereV4 } from '@/lib/embed';
import { requireAuth } from '@/lib/auth';

// Note: Requires an Atlas Vector Search index on collection `scout_vectors`
// Example index definition (create in Atlas UI):
// {
//   "mappings": {
//     "dynamic": true,
//     "fields": {
//       "embedding": {
//         "type": "vector",
//         "similarity": "cosine",
//         "dimensions": 1024
//       }
//     }
//   }
// }

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body = await request.json();
    const { query, limit = 10, rerank = true } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const db = await getUserDb(user.auth0Id);
    const vectors = db.collection('scout_vectors');

    // For some clusters where $vectorSearch isn't enabled, we can fallback to approximate search by
    // embedding the query and using $vectorSearch if available. We'll attempt $vectorSearch.
    const queryEmbedding = await embedTextCohereV4(query, 'search_query');

    // Fetch ~40 most similar chunks
    const approxTop = await vectors
      .aggregate([
        {
          $vectorSearch: {
            index: process.env.ATLAS_VECTOR_INDEX || 'default',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 200,
            limit: 40,
          },
        },
        { $project: { text: 1, url: 1, score: { $meta: 'vectorSearchScore' } } },
      ])
      .toArray();

    const texts: string[] = approxTop.map((d: any) => d.text as string);

    // Rerank to top-k
    const reranked = await rerankCohere(query, texts);
    const topK = reranked
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => ({
        snippet: texts[r.index].slice(0, 500),
        url: approxTop[r.index].url as string,
        score: r.score as number,
      }));

    return NextResponse.json({ results: topK });
  } catch (err) {
    console.error('scout/search error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
