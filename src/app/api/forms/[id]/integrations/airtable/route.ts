
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/utils/encryption';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('airtable_api_key, airtable_base_id, airtable_table_name, airtable_enabled')
      .eq('id', id)
      .single();

    if (formError) throw formError;

    return NextResponse.json({
      apiKey: form?.airtable_api_key ? '********' : null,
      baseId: form?.airtable_base_id,
      tableName: form?.airtable_table_name,
      isEnabled: form?.airtable_enabled
    });
  } catch (err) {
    console.error('Airtable GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const body = await request.json();
    const { action } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // UPDATE CONFIG
    if (action === 'update') {
      const { apiKey, baseId, tableName, enabled } = body;
      const updateData: any = {
        airtable_base_id: baseId,
        airtable_table_name: tableName,
        airtable_enabled: enabled
      };
      if (apiKey && apiKey !== '********') {
        updateData.airtable_api_key = await encrypt(apiKey);
      }

      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // DISCONNECT
    if (action === 'disconnect') {
      const { error } = await supabase
        .from('forms')
        .update({ 
          airtable_api_key: null, 
          airtable_base_id: null,
          airtable_table_name: null,
          airtable_enabled: false 
        })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // BULK SYNC
    if (action === 'sync-existing') {
        const admin = await createAdminClient();
        const { data: form } = await admin
          .from('forms')
          .select('airtable_api_key, airtable_base_id, airtable_table_name, airtable_enabled')
          .eq('id', id)
          .single();
  
        if (!form?.airtable_api_key || !form?.airtable_base_id || !form?.airtable_table_name) {
            return NextResponse.json({ error: 'Airtable not fully configured' }, { status: 400 });
        }

        // 1. Fetch Form Fields
        const { data: fields } = await admin.from('form_fields').select('id, label').eq('form_id', id).order('order');
        if (!fields || fields.length === 0) return NextResponse.json({ error: 'No fields found in form' }, { status: 400 });

        // 2. Fetch Airtable Schema (Metadata API)
        const actualApiKey = await decrypt(form.airtable_api_key);
        const airtableHeaders = {
            'Authorization': `Bearer ${actualApiKey}`,
            'Content-Type': 'application/json'
        };

        const metaResp = await fetch(`https://api.airtable.com/v0/meta/bases/${form.airtable_base_id}/tables`, {
            headers: airtableHeaders
        });

        if (!metaResp.ok) {
            const errData = await metaResp.json();
            return NextResponse.json({ error: `Airtable API Error: ${errData.error?.message || 'Unauthorized'}. Ensure you have 'schema.bases:read' scope.` }, { status: metaResp.status });
        }

        const { tables } = await metaResp.json();
        let table = tables.find((t: any) => t.name === form.airtable_table_name);
        
        // 3. Create Table if it doesn't exist
        if (!table) {
            // Deduplicate labels for Airtable columns
            const usedNames = new Set(["Submission ID", "Submitted At"]);
            const airtableFields = fields.map(f => {
                let name = f.label;
                let counter = 1;
                while (usedNames.has(name)) {
                    name = `${f.label} (${++counter})`;
                }
                usedNames.add(name);
                return { name, type: "multilineText" as const };
            });

            const createTableResp = await fetch(`https://api.airtable.com/v0/meta/bases/${form.airtable_base_id}/tables`, {
                method: 'POST',
                headers: airtableHeaders,
                body: JSON.stringify({
                    name: form.airtable_table_name,
                    description: "Automatically created by Form Builder",
                    fields: [
                        { name: "Submission ID", type: "singleLineText" },
                        { 
                          name: "Submitted At", 
                          type: "dateTime", 
                          options: { 
                            dateFormat: { name: "iso" },
                            timeFormat: { name: "24hour" },
                            timeZone: "utc"
                          } 
                        },
                        ...airtableFields
                    ]
                })
            });

            if (!createTableResp.ok) {
                const errData = await createTableResp.json();
                const errMsg = errData.error?.message || errData.message || JSON.stringify(errData);
                return NextResponse.json({ error: `Failed to create table: ${errMsg}. Ensure 'schema.bases:write' scope.` }, { status: createTableResp.status });
            }
            table = await createTableResp.json();
        } else {
            // 4. Ensure all columns exist (Deduplicate here too)
            const existingFieldNames = new Set(table.fields.map((f: any) => f.name));
            const fieldsToCreate = [];
            
            const usedNames = new Set(existingFieldNames);
            for (const f of fields) {
                if (!existingFieldNames.has(f.label)) {
                    let name = f.label;
                    let counter = 1;
                    while (usedNames.has(name)) {
                        name = `${f.label} (${++counter})`;
                    }
                    usedNames.add(name);
                    fieldsToCreate.push({ label: f.label, airtable_name: name });
                }
            }

            for (const f of fieldsToCreate) {
                await fetch(`https://api.airtable.com/v0/meta/bases/${form.airtable_base_id}/tables/${table.id}/fields`, {
                    method: 'POST',
                    headers: airtableHeaders,
                    body: JSON.stringify({
                        name: f.airtable_name,
                        type: "multilineText"
                    })
                });
            }
        }

        // 5. Get unsynced submissions
        const { data: submissions } = await admin
          .from('submissions')
          .select('*')
          .eq('form_id', id)
          .eq('airtable_synced', false)
          .order('submitted_at');

        if (!submissions || submissions.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'All data already synced to Airtable!' });
        }

        // 6. Push Records (Airtable handles up to 10 records per request)
        // Re-generate name mapping to match the table schema created/found above
        const usedNamesForMapping = new Set(["Submission ID", "Submitted At"]);
        const fieldNameMap: Record<string, string> = {};
        fields.forEach(f => {
            let name = f.label;
            let counter = 1;
            while (usedNamesForMapping.has(name)) {
                name = `${f.label} (${++counter})`;
            }
            usedNamesForMapping.add(name);
            fieldNameMap[f.id] = name;
        });

        const successIds: string[] = [];
        for (let i = 0; i < submissions.length; i += 10) {
            const chunk = submissions.slice(i, i + 10);
            const records = chunk.map(sub => {
                const mappedFields: any = {
                    "Submission ID": sub.id,
                    "Submitted At": sub.submitted_at
                };
                fields.forEach(f => {
                    const airtableColName = fieldNameMap[f.id];
                    let val = sub.data[f.id] || sub.data[f.label] || '';
                    if (Array.isArray(val)) val = val.join(', ');
                    mappedFields[airtableColName] = String(val);
                });
                return { fields: mappedFields };
            });

            const pushResp = await fetch(`https://api.airtable.com/v0/${form.airtable_base_id}/${table.id}`, {
                method: 'POST',
                headers: airtableHeaders,
                body: JSON.stringify({ records })
            });

            if (pushResp.ok) {
                successIds.push(...chunk.map(s => s.id));
            } else {
                console.error('Airtable push failure:', await pushResp.text());
            }
        }

        if (successIds.length > 0) {
            await admin.from('submissions').update({ airtable_synced: true }).in('id', successIds);
        }

        return NextResponse.json({ 
            success: successIds.length > 0, 
            count: successIds.length,
            message: `Successfully synced ${successIds.length} entries to Airtable.`
        });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Airtable POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
