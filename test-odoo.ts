import { authenticate, execute } from './src/lib/odoo';

async function run() {
  console.log('Testing Odoo Connection and Stages...');
  try {
    const uid = await authenticate();
    if (!uid) {
      console.error('Authentication failed!');
      return;
    }
    console.log('Authentication successful.');
    
    // Fetch Stages
    const stagesXml = await execute('crm.stage', 'search_read', [[]], {
      fields: ['id', 'name', 'sequence']
    });
    
    // Simple custom XML parser for stages
    const parseStages = (xml: string) => {
      const records: any[] = [];
      const structMatches = xml.match(/<struct>[\s\S]*?<\/struct>/g) || [];
      for (const struct of structMatches) {
        const obj: any = {};
        const memberMatches = struct.match(/<member>[\s\S]*?<\/member>/g) || [];
        for (const member of memberMatches) {
          const name = member.match(/<name>(.*?)<\/name>/)?.[1];
          const valMatch = member.match(/<string>([\s\S]*?)<\/string>/) || member.match(/<int>(-?\d+)<\/int>/);
          if (name && valMatch) {
            obj[name] = valMatch[1];
          }
        }
        records.push(obj);
      }
      return records;
    };
    
    const stages = parseStages(stagesXml);
    console.log('Odoo Stages found:');
    console.log(JSON.stringify(stages, null, 2));

    // Fetch first 5 leads to see their stage details
    const leadsXml = await execute('crm.lead', 'search_read', [[]], {
      fields: ['id', 'name', 'stage_id', 'active'],
      limit: 5
    });
    
    const parseLeads = (xml: string) => {
      const records: any[] = [];
      const structMatches = xml.match(/<struct>[\s\S]*?<\/struct>/g) || [];
      for (const struct of structMatches) {
        const obj: any = {};
        const memberMatches = struct.match(/<member>[\s\S]*?<\/member>/g) || [];
        for (const member of memberMatches) {
          const name = member.match(/<name>(.*?)<\/name>/)?.[1];
          // For stage_id, it is an array (id, name)
          if (name === 'stage_id') {
            const arrayMatch = member.match(/<array>[\s\S]*?<\/array>/);
            if (arrayMatch) {
              const vals = arrayMatch[0].match(/<int>(\d+)<\/int>|<string>([\s\S]*?)<\/string>/g) || [];
              const id = vals[0]?.match(/<int>(\d+)<\/int>/)?.[1];
              const label = vals[1]?.match(/<string>([\s\S]*?)<\/string>/)?.[1];
              obj[name] = [id ? parseInt(id, 10) : 0, label || ''];
            }
          } else {
            const valMatch = member.match(/<string>([\s\S]*?)<\/string>/) || member.match(/<int>(-?\d+)<\/int>/) || member.match(/<boolean>([01])<\/boolean>/);
            if (name && valMatch) {
              obj[name] = valMatch[1];
            }
          }
        }
        records.push(obj);
      }
      return records;
    };

    const leads = parseLeads(leadsXml);
    console.log('\nSample Leads with Stage IDs:');
    console.log(JSON.stringify(leads, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
