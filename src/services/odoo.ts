'use server';

/**
 * @fileOverview Odoo 18 CRM Integration Service (Server Actions).
 * Handles the mapping between the app's Lead type and Odoo's crm.lead model.
 */

import { authenticate, execute } from '@/lib/odoo';

const DB = 'ASPK60';
const PASSWORD = 'aspk60';

/**
 * Helper to parse Odoo XML response for basic lists of objects.
 */
function parseOdooRecords(xml: string): any[] {
  const records: any[] = [];
  const structMatches = xml.match(/<struct>[\s\S]*?<\/struct>/g) || [];

  for (const struct of structMatches) {
    const obj: any = {};
    const memberMatches = struct.match(/<member>[\s\S]*?<\/member>/g) || [];
    for (const member of memberMatches) {
      const name = member.match(/<name>(.*?)<\/name>/)?.[1];
      let value: any = null;
      
      // Odoo often returns [id, name] for many2one fields.
      // We'll prioritize strings for status mapping, or ints for IDs.
      const stringMatch = member.match(/<string>(.*?)<\/string>/);
      const intMatch = member.match(/<int>(-?\d+)<\/int>/);
      const boolMatch = member.match(/<boolean>(\d+)<\/boolean>/);
      
      if (stringMatch) value = stringMatch[1];
      else if (intMatch) value = parseInt(intMatch[1], 10);
      else if (boolMatch) value = boolMatch[1] === '1';
      
      if (name) obj[name] = value;
    }
    records.push(obj);
  }
  return records;
}

export async function getOdooLeads() {
  try {
    const rawXml = await execute('crm.lead', 'search_read', [[]], {
      fields: ['id', 'name', 'contact_name', 'email_from', 'phone', 'city', 'description', 'stage_id', 'type', 'priority', 'create_date'],
      limit: 100,
      order: 'create_date desc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooLeads error:', error);
    return [];
  }
}

export async function createOdooLead(data: any) {
  try {
    const resultXml = await execute('crm.lead', 'create', [{
      name: data.namaPerusahaan || 'New Lead from CRM App',
      contact_name: data.namaLengkap,
      email_from: data.email,
      phone: data.telepon,
      city: data.kota,
      description: `AI Suggested Segment: ${data.aiSuggestedSegment || 'N/A'}\nReasoning: ${data.aiReasoning || 'N/A'}\n\nNotes: ${data.catatan || ''}`,
      type: 'opportunity',
      priority: data.aiFollowUpPriority === 'High' ? '3' : '1'
    }]);
    
    const match = resultXml.match(/<int>(\d+)<\/int>/);
    return match ? { success: true, id: match[1] } : { success: false };
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

    // Map internal status to Odoo standard stage names
    const statusMap: Record<string, string> = {
      'Baru': 'New',
      'Qualified': 'Qualified',
      'Dihubungi': 'Proposition' // Common Odoo 18 stage name for contacted leads
    };

    const targetStageName = statusMap[status] || status;

    // 1. Find the Stage ID in Odoo based on the name
    const searchStageXml = await execute('crm.stage', 'search', [[['name', 'ilike', targetStageName]]]);
    const stageIdMatch = searchStageXml.match(/<int>(\d+)<\/int>/);

    if (stageIdMatch) {
      const stageId = parseInt(stageIdMatch[1], 10);
      // 2. Update the lead's stage_id
      await execute('crm.lead', 'write', [[id], { stage_id: stageId }]);
      return { success: true };
    } else {
      // Fallback: try to write standard IDs if name search fails (usually 1=New, 2=Qualified, 3=Proposition)
      const fallbackIds: Record<string, number> = { 'Baru': 1, 'Qualified': 2, 'Dihubungi': 3 };
      if (fallbackIds[status]) {
        await execute('crm.lead', 'write', [[id], { stage_id: fallbackIds[status] }]);
        return { success: true };
      }
      throw new Error(`Stage "${targetStageName}" tidak ditemukan di Odoo.`);
    }
  } catch (error: any) {
    console.error('updateOdooLeadStage error:', error);
    return { success: false, error: error.message };
  }
}

export async function syncLeadToOdoo(lead: any) {
  return createOdooLead(lead);
}
