import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface Failure {
  id: string;
  title: string;
  tags: string[];
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: failures, error } = await supabase
      .from('failures')
      .select('id, title, tags')
      .eq('user_id', user.id) as { data: Failure[] | null; error: any };

    if (error || !failures) throw error || new Error('No data');

    const nodes = failures.map(f => ({
      data: { id: f.id, label: f.title, tags: f.tags }
    }));

    const edges: any[] = [];
    for (let i = 0; i < failures.length; i++) {
      for (let j = i + 1; j < failures.length; j++) {
        const commonTags = failures[i].tags.filter((t: string) => failures[j].tags.includes(t));
        if (commonTags.length > 0) {
          edges.push({
            data: { 
              id: `edge-${failures[i].id}-${failures[j].id}`, 
              source: failures[i].id, 
              target: failures[j].id,
              tag: commonTags[0]
            }
          });
        }
      }
    }

    return NextResponse.json({ nodes, edges });
  } catch (err) {
    console.error('GRAPH_DATA_ERROR:', err);
    return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 });
  }
}