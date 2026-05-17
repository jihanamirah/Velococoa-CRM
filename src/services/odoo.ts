'use server';

/**
 * @fileOverview Odoo 18 CRM Integration Service (Server Actions).
 * Menangani komunikasi antara aplikasi dan model crm.lead di Odoo.
 */

import { execute } from '@/lib/odoo';

/**
 * Parser XML Odoo yang lebih tangguh untuk menangani respons dari Odoo 18.
 */
function parseOdooRecords(xml: string): any[] {
  const records: any[] = [];
  
  // Mencari array data utama
  const arrayMatch = xml.match(/<array>([\s\S]*?)<\/array>/);
  if (!arrayMatch) return [];

  const structMatches = arrayMatch[1].match(/<struct>[\s\S]*?<\/struct>/g) || [];

  for (const struct of structMatches) {
    const obj: any = {};
    const memberMatches = struct.match(/<member>[\s\S]*?<\/member>/g) || [];
    
    for (const member of memberMatches) {
      const name = member.match(/<name>(.*?)<\/name>/)?.[1];
      if (!name) continue;

      const valuePart = member.match(/<value>([\s\S]*?)<\/value>/)?.[1] || '';
      let value: any = null;

      const sMatch = valuePart.match(/<string>([\s\S]*?)<\/string>/);
      const iMatch = valuePart.match(/<int>(-?\d+)<\/int>/);
      const bMatch = valuePart.match(/<boolean>([01])<\/boolean>/);
      const aMatch = valuePart.match(/<array>([\s\S]*?)<\/array>/);

      if (aMatch) {
        // Deteksi Many2one (Array: [id, name])
        const s = aMatch[1].match(/<string>([\s\S]*?)<\/string>/);
        if (s) value = s[1];
        else {
          const i = aMatch[1].match(/<int>(-?\d+)<\/int>/);
          if (i) value = parseInt(i[1], 10);
        }
      } else if (sMatch) {
        value = sMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<');
      } else if (iMatch) {
        value = parseInt(iMatch[1], 10);
      } else if (bMatch) {
        value = bMatch[1] === '1';
      }
      
      obj[name] = value;
    }
    records.push(obj);
  }
  return records;
}

export async function getOdooLeads() {
  try {
    const rawXml = await execute('crm.lead', 'search_read', [[]], {
      fields: ['id', 'name', 'contact_name', 'email_from', 'phone', 'city', 'description', 'stage_id', 'priority', 'create_date'],
      limit: 100,
      order: 'create_date desc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooLeads failed:', error);
    return [];
  }
}

export async function createOdooLead(data: any) {
  try {
    const resXml = await execute('crm.lead', 'create', [{
      name: data.namaPerusahaan || 'Opportunity Baru',
      contact_name: data.namaLengkap,
      email_from: data.email,
      phone: data.telepon,
      city: data.kota,
      description: `AI Suggested Segment: ${data.aiSuggestedSegment || 'N/A'}\nReasoning: ${data.aiReasoning || 'N/A'}\n\nNotes: ${data.catatan || ''}`,
      type: 'opportunity',
      priority: data.aiFollowUpPriority === 'High' ? '3' : '1'
    }]);
    
    const idMatch = resXml.match(/<int>(\d+)<\/int>/);
    return idMatch ? { success: true, id: idMatch[1] } : { success: false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncLeadToOdoo(lead: any) {
  return await createOdooLead(lead);
}

export async function updateOdooLeadStage(id: number, status: string) {
  try {
    if (status === 'Won') {
      await execute('crm.lead', 'action_set_won', [[id]]);
      return { success: true };
    } 
    if (status === 'Lost') {
      await execute('crm.lead', 'action_set_lost', [[id]]);
      return { success: true };
    }

    const statusMap: Record<string, string> = {
      'Baru': 'New',
      'Qualified': 'Qualified',
      'Dihubungi': 'Proposition'
    };

    const targetStage = statusMap[status] || status;
    const searchXml = await execute('crm.stage', 'search', [[['name', 'ilike', targetStage]]]);
    const stageMatch = searchXml.match(/<int>(\d+)<\/int>/);

    if (stageMatch) {
      await execute('crm.lead', 'write', [[id], { stage_id: parseInt(stageMatch[1], 10) }]);
      return { success: true };
    }
    return { success: false, error: 'Stage tidak ditemukan' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
