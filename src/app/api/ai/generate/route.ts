import { NextResponse } from 'next/server'
import { getAIRateLimit } from '@/lib/upstash'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type GenerateOptions = {
  pageCount?: number
  includeLogic?: boolean
  logicPrompt?: string
  pagePlan?: string
  styleDirection?: string
  businessGoal?: string
  tone?: string
  targetAudience?: string
  requiredFields?: string
  submitButtonText?: string
}

function buildSystemPrompt(options: GenerateOptions = {}) {
  const pageCountInstruction =
    options.pageCount && options.pageCount > 1
      ? `Create exactly ${options.pageCount} pages using pageIndex values from 0 to ${options.pageCount - 1}.`
      : 'Use one page unless the request clearly needs multiple steps.'

  const logicInstruction = options.includeLogic
    ? `Add conditional logic when useful. Use logicRules on source fields. Each rule must include condition, value, action, and targetId. Target IDs must match real field IDs. Extra logic request: ${options.logicPrompt || 'Use sensible show/hide branching.'}`
    : 'Do not add conditional logic unless the user explicitly asks for it.'

  return `You are a senior product designer and form automation architect for a production SaaS form builder.
Generate a single valid JSON object that can be imported directly into the app. Return only JSON.

Priorities:
- Create forms that are concise, conversion-friendly, accessible, and ready for real users.
- Infer missing details intelligently, but never invent unnecessary fields.
- Use stable snake_case field IDs that are human readable, unique, and match logic targetId references.
- Preserve file upload fields as type "file" or "multifile"; never downgrade them.
- Use pageIndex for multi-page flows. ${pageCountInstruction}
- ${logicInstruction}
- If an image is provided, extract labels, field types, order, intent, required markers, and grouping.
- If text and image conflict, prefer explicit text instructions.

Output schema:
{
  "name": "string",
  "description": "string",
  "logo_url": "",
  "cover_image_url": "",
  "fields": [
    {
      "id": "stable_snake_case_id",
      "label": "string",
      "type": "text|email|number|textarea|select|multiselect|radio|checkbox|rating|file|multifile",
      "required": true,
      "placeholder": "string",
      "options": ["required for select, multiselect, radio, checkbox groups"],
      "pageIndex": 0,
      "logicRules": [
        {
          "id": "stable_rule_id",
          "condition": "equals|not_equals|contains",
          "value": "answer value",
          "action": "show|hide|jump_to",
          "targetId": "target_field_id"
        }
      ]
    }
  ],
  "customStyles": {
    "accentColor": "#HEX",
    "headerBg": "#HEX",
    "headerText": "#HEX",
    "bodyBg": "#HEX",
    "bodyText": "#HEX",
    "labelColor": "#HEX",
    "inputBg": "#HEX",
    "inputBorderColor": "#HEX",
    "pageBgColor": "#HEX",
    "buttonText": "#HEX",
    "layout": "centered|split|sidebar",
    "layoutSide": "left|right",
    "borderRadius": 0,
    "containerWidth": 320,
    "containerPadding": 40,
    "fontFamily": "Inter|Roboto|Outfit|Space Grotesk|DM Sans|Playfair Display|Plus Jakarta Sans",
    "formScale": 1,
    "boxShadow": "CSS shadow string"
  },
  "settings": {
    "submitButtonText": "string",
    "thankYouHeadline": "string",
    "thankYouMessage": "string",
    "redirectUrl": ""
  }
}

Design direction:
- Style direction: ${options.styleDirection || 'modern premium SaaS'}
- Business goal: ${options.businessGoal || 'collect accurate submissions with low friction'}
- Tone: ${options.tone || 'clear, professional, helpful'}
- Audience: ${options.targetAudience || 'general users'}
- Required fields guidance: ${options.requiredFields || 'mark fields required when business-critical'}
- Submit button: ${options.submitButtonText || 'choose a specific action label'}
- Page field plan: ${options.pagePlan || 'No explicit page-by-page field plan provided.'}

Validation rules:
- Include 1 to 100 fields.
- Use pageIndex integers starting at 0.
- When a page field plan is provided, place those fields on the requested pageIndex values.
- Use only hex colors for color tokens.
- Keep descriptions under 1000 characters.
- Keep placeholders practical and short.
- For checkbox with multiple options, include options. For a single consent checkbox, options may be omitted.
- Return raw JSON only.`
}

function parseGeminiJson(text: string) {
  let jsonString = text.trim()
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')
  }
  return JSON.parse(jsonString)
}

function resolveGeminiModel(model: string | undefined, hasImage: boolean) {
  if (model === 'gemma-4-31b-it' || model === 'gemma-4-26b-a4b-it') return model

  return hasImage ? 'gemma-4-31b-it' : 'gemma-4-26b-a4b-it'
}

function getGeminiText(data: any) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part.text || '')
    .join('')
    .trim()
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

    const {
      prompt,
      model,
      imageBase64,
      imageMimeType,
      options,
    } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing. Add it to .env.local and restart the dev server.' },
        { status: 500 }
      )
    }

    if (typeof prompt === 'string' && prompt.length > 8000) {
      return NextResponse.json({ error: 'Prompt is too long. Please keep it under 8,000 characters.' }, { status: 413 })
    }

    if (typeof imageBase64 === 'string' && imageBase64.length > 7_000_000) {
      return NextResponse.json({ error: 'Image is too large. Please upload an image under about 5 MB.' }, { status: 413 })
    }

    const parts: any[] = []
    if (imageBase64 && imageMimeType) {
      parts.push({
        inline_data: {
          data: imageBase64,
          mime_type: imageMimeType,
        },
      })
    }

    if (prompt?.trim()) {
      parts.push({ text: prompt.trim() })
    }

    if (parts.length === 0) {
      return NextResponse.json({ error: 'Either a prompt or an image is required' }, { status: 400 })
    }

    const selectedModel = resolveGeminiModel(model, Boolean(imageBase64))
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
            parts: [{ text: buildSystemPrompt(options || {}) }],
          },
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.35,
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
      const message =
        responseData?.error?.message ||
        responseText ||
        `Gemini request failed with status ${geminiResponse.status}`
      console.error('Gemini API error:', message)
      return NextResponse.json({ error: message }, { status: geminiResponse.status })
    }

    const generatedText = getGeminiText(responseData)
    if (!generatedText) {
      console.error('Gemini returned no text:', responseData)
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 500 }
      )
    }

    try {
      return NextResponse.json(parseGeminiJson(generatedText))
    } catch {
      console.error('Failed to parse Gemini JSON response:', generatedText)
      return NextResponse.json(
        { error: 'AI returned invalid JSON. Please try again with a clearer prompt.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('AI Generation error:', error)
    return NextResponse.json(
      { error: error.message || 'AI generation failed' },
      { status: 500 }
    )
  }
}
