'use server';

/**
 * @fileOverview Odoo 18 CRM Integration Service (Server Actions).
 * Menangani komunikasi antara aplikasi dan model crm.lead di Odoo.
 */

import { execute } from '@/lib/odoo';

/**
 * Parser XML Odoo yang lebih tangguh.
 * Menangani tipe data dasar dan field relasional (many2one).
 */
function parseOdooRecords(xml: string): any[] {
  const records: any[] = [];
  const structMatches = xml.match(/<struct>[\s\S]*?<\/struct>/g) || [];

  for (const struct of structMatches) {
    const obj: any = {};
    const memberMatches = struct.match(/<member>[\s\S]*?<\/member>/g) || [];
    
    for (const member of memberMatches) {
      const name = member.match(/<name>(.*?)<\/name>/)?.[1];
      if (!name) continue;

      const valuePart = member.match(/<value>([\s\S]*?)<\/value>/)?.[1] || '';
      let value: any = null;

      // Deteksi Many2one (Array: [id, name])
      if (valuePart.includes('<array>')) {
        const sMatch = valuePart.match(/<string>(.*?)<\/string>/);
        if (sMatch) value = sMatch[1]; // Ambil nama string-nya
        else {
          const iMatch = valuePart.match(/<int>(-?\d+)<\/int>/);
          if (iMatch) value = parseInt(iMatch[1], 10);
        }
      } else {
        const s = valuePart.match(/<string>(.*?)<\/string>/);
        const i = valuePart.match(/<int>(-?\d+)<\/int>/);
        const b = valuePart.match(/<boolean>(\d+)<\/boolean>/);
        
        if (s) value = s[1];
        else if (i) value = parseInt(i[1], 10);
        else if (b) value = b[1] === '1';
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
    const records = parseOdooRecords(rawXml);
    return records;
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
