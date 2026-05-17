'use server';

/**
 * @fileOverview Odoo 18 CRM Integration Service (Server Actions).
 * Menangani komunikasi dua arah antara aplikasi dan model crm.lead & crm.stage di Odoo.
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
 * Parser XML Odoo untuk daftar record.
 */
function parseOdooRecords(xml: string): any[] {
  const records: any[] = [];
  const structMatches = xml.match(/<struct>[\s\S]*?<\/struct>/g) || [];

  for (const struct of structMatches) {
    const obj: any = {};
    const memberMatches = struct.match(/<member>[\s\S]*?<\/member>/g) || [];
    
    for (const member of memberMatches) {
      const name = member.match(/<name>(.*?)<\/name>/)?.[1];
      const valuePart = member.match(/<value>([\s\S]*?)<\/value>/)?.[1];
      
      if (name && valuePart !== undefined) {
        const val = extractValue(valuePart);
        obj[name] = val;
      }
    }
    records.push(obj);
  }
  return records;
}

export async function getOdooStages() {
  try {
    const rawXml = await execute('crm.stage', 'search_read', [[]], {
      fields: ['id', 'name', 'sequence'],
      order: 'sequence asc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooStages failed:', error);
    return [];
  }
}

export async function getOdooLeads() {
  try {
    const rawXml = await execute('crm.lead', 'search_read', [[]], {
      fields: [
        'id', 'name', 'contact_name', 'email_from', 'phone', 
        'city', 'description', 'stage_id', 'probability', 
        'partner_name', 'priority', 'create_date', 'active'
      ],
      limit: 100,
      order: 'create_date desc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooLeads failed:', error);
    return [];
  }
}

export async function getOdooLeadById(id: number) {
  try {
    const rawXml = await execute('crm.lead', 'read', [[id]], {
      fields: [
        'id', 'name', 'contact_name', 'email_from', 'phone', 
        'city', 'description', 'stage_id', 'probability', 
        'partner_name', 'priority', 'create_date', 'active'
      ]
    });
    const records = parseOdooRecords(rawXml);
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error('getOdooLeadById failed:', error);
    return null;
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

export async function updateOdooLeadStage(leadId: number, stageId: number) {
  try {
    await execute('crm.lead', 'write', [[leadId], { stage_id: stageId }]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setOdooLeadWon(leadId: number) {
  try {
    await execute('crm.lead', 'action_set_won', [[leadId]]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setOdooLeadLost(leadId: number) {
  try {
    await execute('crm.lead', 'action_set_lost', [[leadId]]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncLeadToOdoo(lead: any) {
  try {
    if (lead.odooLeadId) {
      return { success: true, odooId: lead.odooLeadId };
    }
    const res = await createOdooLead(lead);
    return res;
  } catch (error) {
    return { success: false, error: "Gagal sinkronisasi" };
  }
}
