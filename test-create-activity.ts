import { execute } from './src/lib/odoo';

// Helper to parse Odoo XML response
function parseOdooRecords(xml: string): any[] {
  const records: any[] = [];
  const structMatches = xml.match(/<struct>[\s\S]*?<\/struct>/g) || [];
  for (const struct of structMatches) {
    const obj: any = {};
    const memberMatches = struct.match(/<member>[\s\S]*?<\/member>/g) || [];
    for (const member of memberMatches) {
      const name = member.match(/<name>(.*?)<\/name>/)?.[1];
      if (name) {
        obj[name] = member.includes('<nil/>') ? null : member.match(/<(?:string|int|boolean|double)>([\s\S]*?)<\//)?.[1] || '';
      }
    }
    records.push(obj);
  }
  return records;
}

async function run() {
  console.log('Querying ir.model for crm.lead...');
  try {
    const modelXml = await execute('ir.model', 'search_read', [[['model', '=', 'crm.lead']]], {
      fields: ['id', 'name', 'model']
    });
    const models = parseOdooRecords(modelXml);
    console.log('Found crm.lead model inside ir.model:', models);

    if (models.length > 0) {
      const modelId = parseInt(models[0].id, 10);
      const today = new Date().toISOString().split('T')[0];
      
      console.log(`\nAttempting to schedule activity with res_model_id: ${modelId} and res_id: 63...`);
      const activityXml = await execute('mail.activity', 'create', [{
        res_model_id: modelId,
        res_model: 'crm.lead',
        res_id: 63,
        activity_type_id: 3, // Meeting
        summary: 'Meeting Coklat Premium',
        note: 'Meeting to negotiate bulk order volume.',
        date_deadline: today
      }]);
      console.log('Activity response XML:', activityXml);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
