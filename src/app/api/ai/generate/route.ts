
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from "@google/genai";
//gemma-3-4b
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

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
    "accentColor": "#HEX (button & link color)",
    "headerBg": "#HEX (header background)",
    "headerText": "#HEX (header text)",
    "bodyBg": "#HEX (form card background)",
    "bodyText": "#HEX (body text color)",
    "labelColor": "#HEX (field label color)",
    "inputBg": "#HEX (input background)",
    "inputBorderColor": "#HEX (input border)",
    "pageBgColor": "#HEX (full page background)",
    "layout": "centered|split|sidebar",
    "layoutSide": "left|right (for split/sidebar)",
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

Respond ONLY with the JSON object, nothing else. Provide beautiful, modern default styles if not specified.`;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    let jsonString = response.text || "{}";
    jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');

    let generatedForm;
    try {
      generatedForm = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", jsonString);
      throw new Error("AI returned invalid JSON.");
    }

    return NextResponse.json(generatedForm);
  } catch (error: any) {
    console.error('AI Generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate form' }, { status: 500 });
  }
}
