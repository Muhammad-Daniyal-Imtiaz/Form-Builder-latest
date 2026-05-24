import { NextResponse } from 'next/server'
import { getAIRateLimit } from '@/lib/upstash'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseGeminiJson(text: string) {
  let jsonString = text.trim()
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')
  }
  return JSON.parse(jsonString)
}

function resolveGeminiModel(model: string | undefined) {
  if (model === 'gemma-4-31b-it' || model === 'gemma-4-26b-a4b-it') return model
  return 'gemma-4-26b-a4b-it'
}

function getGeminiText(data: any) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part.text || '')
    .join('')
    .trim()
}

function buildSystemPrompt() {
  return `You are an expert SaaS form builder editor.
Return one complete updated form JSON object only. Do not explain.

You will receive:
- currentForm: the existing form title, description, fields, customStyles, and settings
- editPrompt: the user's requested edits

Rules:
- Preserve existing field IDs when a field still represents the same question.
- Generate stable snake_case IDs for new fields.
- Remove fields only when the user asks to remove them.
- Keep all existing fields unless the edit requires changing/removing/reordering them.
- Use pageIndex integers starting at 0.
- If the user asks for pages, place fields on the requested pages.
- If the user asks for conditional logic, add logicRules to the source field and ensure targetId matches a real field ID.
- Preserve file uploads as type "file" or "multifile".
- Improve design tokens only when requested or when it clearly supports the requested design.
- Return valid JSON matching this shape:
{
  "title": "string",
  "description": "string",
  "fields": [
    {
      "id": "stable_id",
      "label": "string",
      "type": "text|email|number|textarea|select|multiselect|radio|checkbox|file|multifile|rating",
      "required": true,
      "placeholder": "string",
      "options": ["for choice fields"],
      "pageIndex": 0,
      "logicRules": [
        {
          "id": "stable_rule_id",
          "condition": "equals|not_equals|contains",
          "value": "answer value",
          "action": "show|hide|jump_to",
          "targetId": "target_field_id"
        }
      ],
      "fieldBg": "#ffffff",
      "fieldTextColor": "#111827"
    }
  ],
  "customStyles": {},
  "settings": {
    "submitButtonText": "string",
    "thankYouHeadline": "string",
    "thankYouMessage": "string",
    "redirectUrl": ""
  }
}`
}

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get('x-vercel-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') || 
                     'anonymous'
    
    const ratelimit = getAIRateLimit()
    if (ratelimit) {
      const { success } = await ratelimit.limit(`ai:${clientIp}`)
      if (!success) {
        return NextResponse.json({ 
          error: 'Too many AI requests. Please try again in 1 minute.' 
        }, { status: 429 })
      }
    }

    const { model, editPrompt, currentForm } = await req.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing.' }, { status: 500 })
    }

    if (!editPrompt?.trim()) {
      return NextResponse.json({ error: 'Tell AI what to change in the form.' }, { status: 400 })
    }

    if (typeof editPrompt === 'string' && editPrompt.length > 5000) {
      return NextResponse.json({ error: 'Edit request is too long. Please keep it under 5,000 characters.' }, { status: 413 })
    }

    if (!currentForm) {
      return NextResponse.json({ error: 'Current form data is required.' }, { status: 400 })
    }

    const currentFormJson = JSON.stringify(currentForm)
    if (currentFormJson.length > 60_000) {
      return NextResponse.json({ error: 'This form is too large for one AI edit. Please edit a smaller section.' }, { status: 413 })
    }

    const selectedModel = resolveGeminiModel(model)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: buildSystemPrompt() }],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: JSON.stringify({ editPrompt, currentForm }, null, 2),
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.25,
            topP: 0.9,
          },
        }),
      }
    )

    const responseText = await geminiResponse.text()
    let responseData: any = null
    try {
      responseData = responseText ? JSON.parse(responseText) : null
    } catch {
      responseData = null
    }

    if (!geminiResponse.ok) {
      const message = responseData?.error?.message || responseText || `Gemini request failed with status ${geminiResponse.status}`
      console.error('AI form edit error:', message)
      return NextResponse.json({ error: message }, { status: geminiResponse.status })
    }

    const generatedText = getGeminiText(responseData)
    if (!generatedText) {
      return NextResponse.json({ error: 'AI returned an empty edit response.' }, { status: 500 })
    }

    try {
      return NextResponse.json(parseGeminiJson(generatedText))
    } catch {
      console.error('Failed to parse AI form edit JSON:', generatedText)
      return NextResponse.json({ error: 'AI returned invalid JSON. Try a clearer edit request.' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('AI form edit route error:', error)
    return NextResponse.json({ error: error.message || 'AI form edit failed' }, { status: 500 })
  }
}
