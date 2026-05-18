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
  console.log('Querying mail.activity.type from Odoo...');
  try {
    const typesXml = await execute('mail.activity.type', 'search_read', [[]], {
      fields: ['id', 'name', 'category']
    });
    const types = parseOdooRecords(typesXml);
    console.log('Available Activity Types in Odoo:');
    console.log(types.map(t => ({ id: t.id, name: t.name, category: t.category })));

    console.log('\nAttempting to schedule a test activity on crm.lead ID 63...');
    const today = new Date().toISOString().split('T')[0];
    const activityXml = await execute('mail.activity', 'create', [{
      res_model: 'crm.lead',
      res_id: 63,
      activity_type_id: 3, // 3 is usually Meeting in Odoo
      summary: 'Meeting Coklat Bubuk',
      note: 'Meeting pembahasan volume bulk order coklat premium.',
      date_deadline: today
    }]);
    console.log('Activity create response XML:', activityXml);
  } catch (error) {
    console.error('Error with activities:', error);
  }
}

run();
