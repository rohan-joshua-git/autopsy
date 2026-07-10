import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, text, breakdownData } = await req.json();

    const result = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: { role: 'user', parts: [{ text }] },
      config: { outputDimensionality: 768 },
    });

    const { error } = await supabase.from('failures').insert({
      user_id: userId,
      title: `Manual Reflection ${new Date().toLocaleDateString('en-SG')}`,
      type: 'reflection',
      reflection_notes: text,
      breakdown_data: breakdownData,
      embedding: result.embeddings?.values ?? null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}