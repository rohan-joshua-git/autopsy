import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type, Schema } from '@google/genai'
import { z } from 'zod'
import { TAXONOMY } from '@/lib/taxonomy'

export const runtime = 'nodejs'

// Initialize the free Gemini client using your environment key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// ─── Zod Schema for Runtime Validation ──────────────────────────────────────
const ExamEntrySchema = z.object({
  questionNumber: z.string(),
  questionText: z.string(),
  studentAnswer: z.string(),
  maxMarks: z.number(),
  marksAwarded: z.number(),
  marksLost: z.number(),
  rootCause: z.enum(TAXONOMY as [string, ...string[]]),
  explanation: z.string(),
})

type ExamEntry = z.infer<typeof ExamEntrySchema>

// ─── Gemini Structured Schema Configuration ──────────────────────────────────
const examAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    entries: {
      type: Type.ARRAY,
      description: "List of point deductions or errors found in the exam document.",
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.STRING },
          questionText: { type: Type.STRING },
          studentAnswer: { type: Type.STRING },
          maxMarks: { type: Type.INTEGER },
          marksAwarded: { type: Type.INTEGER },
          marksLost: { type: Type.INTEGER },
          rootCause: { 
            type: Type.STRING, 
            enum: TAXONOMY,
            description: "Must match exactly one category from our error taxonomy matrix."
          },
          explanation: { type: Type.STRING }
        },
        required: ["questionNumber", "questionText", "studentAnswer", "maxMarks", "marksAwarded", "marksLost", "rootCause", "explanation"]
      }
    }
  },
  required: ["entries"]
}

// ─── System Prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert exam marker analyst. You will be shown a student's marked exam script.
Your job is to identify every question where the student lost marks and classify the root cause of each error.

Available Taxonomy Categories:
${TAXONOMY.map(t => `- ${t}`).join('\n')}

Marking conventions you will see on the page:
- Questions are numbered (e.g. "1", "1a", "2b", "Q3")
- Maximum marks for each part appear in brackets, e.g. [3] or (3 marks)
- The examiner writes the marks awarded next to the question
- Crosses (✗), strikethroughs, and margin comments indicate incorrect or incomplete parts
- A question has marks LOST when marksAwarded < maxMarks

Rules:
- Only include questions where marks were actually lost (marksAwarded < maxMarks)
- marksLost must equal maxMarks − marksAwarded
- If the page contains no questions or no mark deductions, return entries: []
- Do NOT fabricate entries — only report what is visibly on the page.`

// ─── Route Handler ───────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file = data.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Upload a PDF or image.` },
        { status: 400 }
      )
    }

    // Convert file buffer natively to raw Base64 
    const bytes = await file.arrayBuffer()
    const base64Payload = Buffer.from(bytes).toString('base64')

    console.log(`[route] Parsing file: ${file.name} (${file.type}) — Size: ${bytes.byteLength} bytes`)

    // Call Gemini with the raw binary array
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Payload
          }
        },
        `Analyze the attached student exam script document. Identify and extract all questions where the student lost marks.`
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: examAnalysisSchema,
      }
    })

    if (!response.text) {
      return NextResponse.json({ error: 'Empty text returned from engine.' }, { status: 500 })
    }

    const parsedJson = JSON.parse(response.text)
    const allEntries: ExamEntry[] = parsedJson.entries || []

    if (allEntries.length === 0) {
      return NextResponse.json(
        {
          error: 'No mark deductions were found in this exam script. The student may have scored full marks, or the marking annotations were not clearly visible.',
        },
        { status: 400 }
      )
    }

    // ─── MAP TO FRONTEND STRUCTURE ───────────────────────────────────────────
    // Translates Zod schema keys to match what the /reflect layout displays
    const mappedEntries = allEntries.map((e) => ({
      questionNumber: e.questionNumber,
      marksDeducted: e.marksLost,
      errorCategory: e.rootCause,      // Maps rootCause -> errorCategory
      description: e.explanation,      // Maps explanation -> description
      questionText: e.questionText,    // Remained for reference strings
      studentAnswer: e.studentAnswer,
    }))

    // Derive overall unique tags from the results
    const overallTags = [...new Set(allEntries.map((e) => e.rootCause).filter(Boolean))]

    console.log(`[route] Success — Parsed and mapped ${mappedEntries.length} complete deductions natively!`)

    // Keep response signature identical to your original structure so frontend doesn't break
    return NextResponse.json({
      success: true,
      meta: {
        pagesTotal: file.type === 'application/pdf' ? 'Multi-page Document' : 1,
        pagesAnalyzed: 1,
        pagesFailed: 0,
      },
      data: { entries: mappedEntries, overallTags },
    })

  } catch (error) {
    console.error('[route] Unhandled route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}