import { TAXONOMY } from '@/lib/taxonomy';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const examAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    entries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.STRING },
          marksLost: { type: Type.INTEGER },
          rootCause: { type: Type.STRING },
          explanation: { type: Type.STRING },
          tags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING, enum: TAXONOMY } 
          }
        },
        required: ["questionNumber", "marksLost", "rootCause", "explanation", "tags"]
      }
    }
  },
  required: ["entries"]
};

async function callGeminiWithRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await operation();
    } catch (err: any) {
      const isTransient = [429, 500, 503, 504].includes(err.status);
      if (isTransient && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(res => setTimeout(res, delay));
        attempt++;
        continue;
      }
      throw err;
    }
  }
  throw new Error('Gemini API exhausted retries');
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.formData();
    const file = data.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: `Analyze the exam script. Map each deduction to the MOST RELEVANT category from: ${TAXONOMY.join(', ')}. Return structured JSON.` }
        ],
        config: { responseMimeType: 'application/json', responseSchema: examAnalysisSchema }
      })
    );

    if (!response.text) throw new Error('Model returned empty response');

    const parsed = JSON.parse(response.text);
    const entries = parsed.entries || [];
    const newEntryTags = Array.from(new Set(entries.flatMap((e: any) => e.tags || []))) as string[];

    let savedEntryId = null;

    if (entries.length > 0) {
      const summary = entries.map((e: any) => `${e.questionNumber}: ${e.explanation}`).join('\n');

      let embedding = null;
      try {
        const embedRes = await callGeminiWithRetry(() =>
          ai.models.embedContent({
            model: 'gemini-embedding-2',
            contents: { role: 'user', parts: [{ text: summary }] }
          })
        );
        embedding = embedRes.embeddings?.values ?? null;
      } catch (e) {
        console.error("Embedding failed", e);
      }

      const { data: inserted, error: insertError } = await supabase.from('failures').insert({
        user_id: user.id,
        title: file.name,
        type: 'Exam Script',
        tags: newEntryTags,
        reflection_notes: summary,
        breakdown_data: entries,
        embedding
      }).select('id').single();

      if (insertError) throw insertError;
      savedEntryId = inserted.id;
    }

    return NextResponse.json({ success: true, id: savedEntryId, count: entries.length });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}