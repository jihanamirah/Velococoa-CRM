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
  console.log('Fetching mail.activity fields description...');
  try {
    const fieldsXml = await execute('mail.activity', 'fields_get', [], {
      attributes: ['type', 'string', 'required']
    });
    // Let's print a portion of fieldsXml or print the keys
    console.log('Raw response length:', fieldsXml.length);
    
    // Check if we can find 'res_id' in the raw XML
    const resIdIndex = fieldsXml.indexOf('<name>res_id</name>');
    if (resIdIndex !== -1) {
      console.log('Found res_id in fields_get! Portion:');
      console.log(fieldsXml.substring(resIdIndex, resIdIndex + 500));
    }
    
    const resModelIndex = fieldsXml.indexOf('<name>res_model</name>');
    if (resModelIndex !== -1) {
      console.log('Found res_model in fields_get! Portion:');
      console.log(fieldsXml.substring(resModelIndex, resModelIndex + 500));
    }
  } catch (error) {
    console.error('Error fetching fields:', error);
  }
}

run();
