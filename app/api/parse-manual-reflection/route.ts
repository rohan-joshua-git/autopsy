import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { userId, text, breakdownData } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent(text);

    const { error } = await supabase.from('failures').insert({
      user_id: userId,
      title: `Manual Reflection ${new Date().toLocaleDateString('en-SG')}`,
      type: 'reflection',
      reflection_notes: text,
      breakdown_data: breakdownData,
      embedding: result.embedding.values,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}