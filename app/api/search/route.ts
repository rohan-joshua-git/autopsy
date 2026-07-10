import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { query, limit = 5 } = await req.json();
    const cookieStore = await cookies();

    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() { /* no-op: route handler response already sent */ },
        },
      }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: { role: 'user', parts: [{ text: query }] },
      config: { outputDimensionality: 768 },
    });

    const embedding = response.embeddings?.values;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: matches, error: rpcError } = await supabase.rpc('match_failures', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: limit,
      filter_user_id: user.id
    });

    if (rpcError) throw rpcError;
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('SEARCH_ERROR:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
