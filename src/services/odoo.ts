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
 * Note: A full XML parser would be better, but we use regex for zero-dependency simplicity in this prototype.
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
      if (member.includes('<string>')) value = member.match(/<string>(.*?)<\/string>/)?.[1];
      else if (member.includes('<int>')) value = parseInt(member.match(/<int>(\d+)<\/int>/)?.[1] || '0', 10);
      else if (member.includes('<boolean>')) value = member.match(/<boolean>(\d+)<\/boolean>/)?.[1] === '1';
      
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
      limit: 50
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
      name: data.namaPerusahaan || 'New Lead',
      contact_name: data.namaLengkap,
      email_from: data.email,
      phone: data.telepon,
      city: data.kota,
      description: `AI Suggested Segment: ${data.aiSuggestedSegment || 'N/A'}\nReasoning: ${data.aiReasoning || 'N/A'}\nNotes: ${data.catatan || ''}`,
      type: 'opportunity',
      priority: data.aiFollowUpPriority === 'High' ? '3' : '1'
    }]);
    
    const match = resultXml.match(/<int>(\d+)<\/int>/);
    return match ? { success: true, id: match[1] } : { success: false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOdooLeadStage(id: number, stageName: string) {
  try {
    // In Odoo 18, we typically set probability or use stage_id
    // For simplicity, we'll mark as won/lost using standard methods if applicable
    if (stageName === 'Won') {
      await execute('crm.lead', 'action_set_won', [[id]]);
    } else if (stageName === 'Lost') {
      await execute('crm.lead', 'action_set_lost', [[id]]);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncLeadToOdoo(lead: any) {
  return createOdooLead(lead);
}
