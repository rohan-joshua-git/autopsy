import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { TAXONOMY } from '@/lib/taxonomy';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const reflectionAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: TAXONOMY },
    },
    severity: { type: Type.INTEGER },
  },
  required: ['tags', 'severity'],
};

interface ReflectionAnalysis {
  tags: string[];
  severity: number;
}

async function classifyReflection(text: string): Promise<ReflectionAnalysis> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          text: `Analyze this student's self-reflection about a past failure. Map it to the MOST RELEVANT categories (at most 3) from: ${TAXONOMY.join(', ')}. Also rate the severity of this failure on a scale of 1-20 (1 = minor/trivial slip, 20 = severe/critical failure with major consequences), based on how significant the described impact sounds. Return structured JSON.\n\nReflection:\n${text}`,
        },
      ],
      config: { responseMimeType: 'application/json', responseSchema: reflectionAnalysisSchema },
    });
    if (!response.text) return { tags: [], severity: 0 };
    const parsed = JSON.parse(response.text);
    return {
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      severity: typeof parsed.severity === 'number' ? parsed.severity : 0,
    };
  } catch (e) {
    console.error('Reflection analysis failed', e);
    return { tags: [], severity: 0 };
  }
}

export async function POST(req: Request) {
  try {
    const { title, text } = await req.json();
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [embedResult, analysis] = await Promise.all([
      ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: { role: 'user', parts: [{ text }] },
        config: { outputDimensionality: 768 },
      }),
      classifyReflection(text),
    ]);

    const { error } = await supabase.from('failures').insert({
      user_id: user.id,
      title: (title && title.trim()) || `Manual Reflection ${new Date().toLocaleDateString('en-SG')}`,
      type: 'reflection',
      reflection_notes: text,
      breakdown_data: [{ marksLost: analysis.severity }],
      tags: analysis.tags,
      embedding: embedResult.embeddings?.[0]?.values ?? null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, tags: analysis.tags, severity: analysis.severity });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
