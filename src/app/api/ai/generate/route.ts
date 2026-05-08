import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing from process.env');
      return NextResponse.json({ 
        error: 'API Key missing. Please ensure GEMINI_API_KEY is set in Cloudflare environment variables and redeploy your app.' 
      }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Default to gemma-4-26b-a4b-it if no model is selected
    const selectedModel = model || "gemma-4-26b-a4b-it";

    const systemPrompt = `You are an AI Form Generator. Your task is to generate a valid JSON structure for a form based on the user's prompt. 
Do not wrap the JSON in markdown code blocks, just return the raw JSON object.

SCHEMA:
{
  "name": "string",
  "description": "string",
  "logo_url": "image URL (optional)",
  "cover_image_url": "banner image URL (optional)",
  "fields": [
    {
      "label": "string",
      "type": "text|email|number|textarea|select|multiselect|radio|checkbox|rating|file",
      "required": true|false,
      "placeholder": "string (optional)",
      "options": ["array of strings - required for select/multiselect/radio/checkbox"]
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
    "layout": "centered|split|sidebar",
    "layoutSide": "left|right",
    "borderRadius": 0-64,
    "containerWidth": 320-1200,
    "fontFamily": "Inter|Roboto|Outfit|Space Grotesk|DM Sans|Manrope|Playfair Display",
    "formScale": 0.5-1.5
  },
  "settings": {
    "submitButtonText": "string",
    "thankYouHeadline": "string",
    "thankYouMessage": "string"
  }
}

Respond ONLY with the JSON object, nothing else.`;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: systemPrompt + "\n\nUser Request: " + prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonString = response.text || "{}";
    
    let generatedForm;
    try {
      generatedForm = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", jsonString);
      return NextResponse.json({ error: "AI returned invalid JSON structure. Please try again." }, { status: 500 });
    }

    return NextResponse.json(generatedForm);
  } catch (error: any) {
    console.error('AI Generation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
