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
  console.log('Testing Odoo mail.message / chatter integration for Lead ID 63...');
  try {
    // 1. Fetch existing chatter messages for Lead ID 63
    const rawXml = await execute('mail.message', 'search_read', [[
      ['model', '=', 'crm.lead'],
      ['res_id', '=', 63]
    ]], {
      fields: ['id', 'date', 'body', 'message_type', 'description'],
      limit: 10
    });
    const messages = parseOdooRecords(rawXml);
    console.log(`Found ${messages.length} messages in Odoo chatter:`);
    console.log(messages.map(m => ({
      id: m.id,
      date: m.date,
      body: m.body?.replace(/<[^>]*>/g, ''), // Strip HTML
      message_type: m.message_type
    })));

    // 2. Test posting a message using Odoo's message_post API
    console.log('\nTesting posting a log to chatter...');
    const postResXml = await execute('crm.lead', 'message_post', [[63]], {
      body: 'Test log from VeloCocoa CRM: Hubungi customer via WhatsApp',
      message_type: 'comment',
      subtype_xmlid: 'mail.mt_comment'
    });
    console.log('Post response XML:', postResXml);
  } catch (error) {
    console.error('Error in chatter integration:', error);
  }
}

run();
