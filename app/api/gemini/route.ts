import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 })
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ parts: [{ text: prompt }] }],
    })

    return NextResponse.json({ text: response.text })

  } catch (error) {
    console.error('[gemini route]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gemini error' },
      { status: 500 }
    )
  }
}