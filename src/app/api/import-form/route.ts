import { NextResponse } from 'next/server';
import { FormSchema } from '@/lib/form-schema';
import { validateAndSanitizeFormData } from '@/lib/proto-sanitize';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { jsonString } = body;

    if (!jsonString) {
      return NextResponse.json({ error: 'JSON string is required' }, { status: 400 });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    // Sanitize for prototype pollution
    const sanitizedData = validateAndSanitizeFormData(parsedData);

    // Validate against schema
    const validatedData = FormSchema.parse(sanitizedData);

    // Add user ownership
    const formToInsert = {
      title: validatedData.title,
      description: validatedData.description || '',
      user_id: user.id,
      published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Map other settings if needed
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('forms')
      .insert([formToInsert])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save form' }, { status: 500 });
    }

    // Now insert fields
    if (validatedData.fields && validatedData.fields.length > 0) {
      const fieldsToInsert = validatedData.fields.map((field, index) => ({
        form_id: data.id,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder || null,
        order: index,
        options: 'options' in field ? field.options : null,
      }));

      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(fieldsToInsert);

      if (fieldsError) {
        console.error('Fields insert error:', fieldsError);
        // We might want to delete the form if fields fail, or just return an error
      }
    }

    return NextResponse.json({ 
      message: 'Form imported successfully',
      formId: data.id 
    });

  } catch (validationError: any) {
    console.error('Validation error:', validationError);
    return NextResponse.json({ 
      error: 'Invalid form data',
      details: validationError.message 
    }, { status: 400 });
  }
}
