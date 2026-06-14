import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const examAnalysisSchema: Schema = {
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
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["questionNumber", "marksLost", "rootCause", "explanation", "tags"]
      }
    }
  },
  required: ["entries"]
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.formData();
    const file = data.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes = await file.arrayBuffer();

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ inlineData: { mimeType: file.type, data: Buffer.from(bytes).toString('base64') } }, { text: "Extract mark deductions and categorize them with tags." }],
        config: { responseMimeType: 'application/json', responseSchema: examAnalysisSchema }
      });
    } catch (err: any) {
      if (err.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
      }
      throw err;
    }

    if (!response.text) throw new Error('Model returned empty response');
    
    const parsed = JSON.parse(response.text);
    const entries = parsed.entries || [];
    const newEntryTags = Array.from(new Set(entries.flatMap((e: any) => e.tags || []))) as string[];

    let isRedFlag = false;

    if (entries.length > 0) {
      const { data: pastFailures } = await supabase
        .from('failures')
        .select('tags')
        .eq('user_id', user.id);

      const overlapCount = pastFailures?.filter(past => {
        const commonTags = past.tags.filter((t: string) => newEntryTags.includes(t));
        return commonTags.length >= 2;
      }).length || 0;

      if (overlapCount >= 2) isRedFlag = true;

      const summary = entries.map((e: any) => `${e.questionNumber}: ${e.explanation}`).join('\n');
      const embed = await ai.models.embedContent({ 
        model: 'text-embedding-004', 
        contents: { role: 'user', parts: [{ text: summary }] } 
      });
      
      await supabase.from('failures').insert({
        user_id: user.id,
        title: file.name,
        type: 'Exam Script',
        tags: newEntryTags,
        reflection_notes: summary,
        breakdown_data: entries,
        embedding: embed.embeddings?.values
      });
    }

    return NextResponse.json({ 
      success: true, 
      count: entries.length, 
      redFlag: isRedFlag 
    });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}