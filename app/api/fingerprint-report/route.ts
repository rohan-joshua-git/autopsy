import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { TAXONOMY } from '@/lib/taxonomy';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const TOP_TAG_COUNT = 6;
const MIN_ENTRIES_FOR_NARRATIVE = 2;

const fingerprintSchema = {
  type: Type.OBJECT,
  properties: {
    overallSummary: { type: Type.STRING },
    dominantPatterns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tag: { type: Type.STRING, enum: TAXONOMY },
          insight: { type: Type.STRING },
          remediation: { type: Type.STRING },
        },
        required: ['tag', 'insight', 'remediation'],
      },
    },
  },
  required: ['overallSummary', 'dominantPatterns'],
};

export async function POST() {
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
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: entries, error: fetchError } = await supabase
      .from('failures')
      .select('tags, breakdown_data');

    if (fetchError) throw fetchError;

    const totalEntries = entries?.length || 0;

    const tagStats: Record<string, { count: number; marksLost: number }> = {};
    (entries || []).forEach(entry => {
      const marksLost = (entry.breakdown_data || []).reduce(
        (sum: number, q: { marksLost?: number }) => sum + (q.marksLost || 0), 0
      );
      (entry.tags || []).forEach((tag: string) => {
        const stats = (tagStats[tag] ??= { count: 0, marksLost: 0 });
        stats.count += 1;
        stats.marksLost += marksLost;
      });
    });

    const tagFrequencies = Object.entries(tagStats)
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        percent: totalEntries > 0 ? Math.round((stats.count / totalEntries) * 100) : 0,
        marksLost: stats.marksLost,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_TAG_COUNT);

    if (totalEntries < MIN_ENTRIES_FOR_NARRATIVE) {
      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        totalEntries,
        tagFrequencies,
        overallSummary: '',
        dominantPatterns: [],
        insufficientData: true,
      });
    }

    const statsBlock = tagFrequencies
      .map(t => `- ${t.tag}: appears in ${t.count}/${totalEntries} cases (${t.percent}%), ${t.marksLost} marks lost total`)
      .join('\n');

    const prompt = `You are analyzing a student's longitudinal record of academic failures for a "Failure Fingerprint Report". Below is the frequency breakdown of their root-cause tags across all logged cases:

${statsBlock}

Write a concise, direct overall summary (2-4 sentences) identifying which behavioral triggers are most persistent and what that pattern says about the student's habits. Then, for each dominant pattern listed above (do not invent new ones, do not exceed ${tagFrequencies.length}), give a short contextual insight explaining why this keeps happening rather than restating the frequency, and one targeted, actionable remediation strategy. Be specific and direct, avoid generic advice.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: prompt }],
      config: { responseMimeType: 'application/json', responseSchema: fingerprintSchema },
    });

    if (!response.text) throw new Error('Model returned empty response');
    const parsed = JSON.parse(response.text);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totalEntries,
      tagFrequencies,
      overallSummary: parsed.overallSummary || '',
      dominantPatterns: parsed.dominantPatterns || [],
      insufficientData: false,
    });
  } catch (err) {
    console.error('FINGERPRINT_REPORT_ERROR:', err);
    return NextResponse.json({ error: 'Failed to generate fingerprint report' }, { status: 500 });
  }
}
