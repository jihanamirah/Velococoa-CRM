'use server';

/**
 * @fileOverview Odoo 18 CRM Integration Service (Server Actions).
 * Menangani komunikasi antara aplikasi dan model crm.lead di Odoo.
 */

import { execute } from '@/lib/odoo';

/**
 * Ekstraktor nilai dari tag XML secara aman.
 */
function extractValue(xml: string): any {
  const sMatch = xml.match(/<string>([\s\S]*?)<\/string>/);
  if (sMatch) return sMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  
  const iMatch = xml.match(/<int>(-?\d+)<\/int>/);
  if (iMatch) return parseInt(iMatch[1], 10);
  
  const bMatch = xml.match(/<boolean>([01])<\/boolean>/);
  if (bMatch) return bMatch[1] === '1';

  const dMatch = xml.match(/<double>([\d.]+)<\/double>/);
  if (dMatch) return parseFloat(dMatch[1]);

  // Handle Array (e.g. Many2one [id, name])
  const arrayMatch = xml.match(/<array>[\s\S]*?<data>([\s\S]*?)<\/data>[\s\S]*?<\/array>/);
  if (arrayMatch) {
    const values = arrayMatch[1].match(/<value>[\s\S]*?<\/value>/g) || [];
    return values.map(v => extractValue(v));
  }

  return null;
}

/**
 * Parser XML Odoo yang lebih tangguh.
 */
function parseOdooRecords(xml: string): any[] {
  const records: any[] = [];
  
  // Ambil semua struct yang ada di dalam array respons
  const structMatches = xml.match(/<struct>[\s\S]*?<\/struct>/g) || [];

  for (const struct of structMatches) {
    const obj: any = {};
    const memberMatches = struct.match(/<member>[\s\S]*?<\/member>/g) || [];
    
    for (const member of memberMatches) {
      const name = member.match(/<name>(.*?)<\/name>/)?.[1];
      const valuePart = member.match(/<value>([\s\S]*?)<\/value>/)?.[1];
      
      if (name && valuePart !== undefined) {
        const val = extractValue(valuePart);
        // Jika Many2one, ambil string label-nya saja untuk kemudahan UI
        if (Array.isArray(val) && val.length === 2) {
          obj[name] = val[1];
        } else {
          obj[name] = val;
        }
      }
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
    console.error('createOdooLead failed:', error);
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

    const targetStageName = statusMap[status] || status;
    
    // Cari ID Stage berdasarkan nama
    const searchStageXml = await execute('crm.stage', 'search', [[['name', 'ilike', targetStageName]]]);
    const stageIdMatch = searchStageXml.match(/<int>(\d+)<\/int>/);

    if (stageIdMatch) {
      await execute('crm.lead', 'write', [[id], { stage_id: parseInt(stageIdMatch[1], 10) }]);
      return { success: true };
    }
    
    return { success: false, error: `Stage '${targetStageName}' tidak ditemukan di Odoo.` };
  } catch (error: any) {
    console.error('updateOdooLeadStage failed:', error);
    return { success: false, error: error.message };
  }
}
