import { NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Ensure this runs in the Node.js runtime (the Google SDK and env access are not Edge-safe).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt, model, imageBase64, imageMimeType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing from process.env');
      return NextResponse.json({ 
        error: 'API Key missing. Please ensure GEMINI_API_KEY is set in Cloudflare environment variables and redeploy your app.' 
      }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Default to 31B if an image is provided since it's the most capable for vision, otherwise default to 26B
    const selectedModel = model || (imageBase64 ? "gemma-4-31b-it" : "gemma-4-26b-a4b-it");

    const systemPrompt = `You are an AI Form Generator. Your task is to generate a valid JSON structure for a form based on the user's prompt and/or the provided image.
If an image is provided, extract the form fields, labels, structure, and intent to build a digital version of that form.
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

    const config: any = {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
    };

    // The gemma-4-26b-a4b-it model requires thinking to be explicitly enabled
    if (selectedModel === 'gemma-4-26b-a4b-it') {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH
      };
    }

    const requestContents: any[] = [];
    if (imageBase64 && imageMimeType) {
      requestContents.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType
        }
      });
    }

    if (prompt) {
      requestContents.push(prompt);
    }

    if (requestContents.length === 0) {
      return NextResponse.json({ error: 'Either a prompt or an image is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: requestContents,
      config
    });

    let jsonString = response.text || "{}";
    jsonString = jsonString.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    }
    
    let generatedForm;
    try {
      generatedForm = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      
      // Transform to match FormSchema exactly
      const finalForm: any = {
        title: generatedForm.title || generatedForm.name || "AI Generated Form",
        description: generatedForm.description || "",
        fields: []
      };

      // Ensure every field has an ID and a supported type
      if (Array.isArray(generatedForm.fields)) {
        finalForm.fields = generatedForm.fields.map((field: any, index: number) => {
          // Fallback 'file' to 'text' as 'file' is not in FormSchema
          let type = field.type || 'text';
          if (!['text', 'email', 'number', 'select', 'checkbox', 'radio', 'textarea'].includes(type)) {
            type = 'text'; 
          }
          
          return {
            ...field,
            id: field.id || `field_${Date.now()}_${index}`,
            type: type
          };
        });
      }

      // Serialize styles and settings into description if they exist
      let descPayload = finalForm.description;
      if (generatedForm.customStyles) {
        descPayload += `|||STYLES:${JSON.stringify(generatedForm.customStyles)}`;
      }
      if (generatedForm.settings) {
        descPayload += `|||SETTINGS:${JSON.stringify(generatedForm.settings)}`;
      }
      finalForm.description = descPayload;

      generatedForm = finalForm;
      
    } catch (parseError) {
      console.error("Failed to parse JSON response:", jsonString);
      return NextResponse.json({ error: "AI returned invalid JSON structure. Please try again." }, { status: 500 });
    }

    return NextResponse.json(generatedForm);
  } catch (error: any) {
    console.error('AI Generation error:', error);
    const message =
      typeof error?.message === 'string' && error.message.length > 0
        ? error.message
        : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
