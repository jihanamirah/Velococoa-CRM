'use server';

/**
 * @fileOverview Odoo 18 CRM Integration Service (Server Actions).
 */

import { execute } from '@/lib/odoo';

function extractValue(xml: string): any {
  if (xml.includes('<nil/>')) return null;
  
  // 1. Check for array first to prevent array strings matching string check
  const arrayMatch = xml.match(/<array>[\s\S]*?<data>([\s\S]*?)<\/data>[\s\S]*?<\/array>/);
  if (arrayMatch) {
    const valuePart = arrayMatch[1];
    const matches = valuePart.match(/<value>(?:(?!<value>)[\s\S])*?<\/value>/g) || [];
    return matches.map(v => {
      const inner = v.replace(/^<value>([\s\S]*)<\/value>$/, '$1');
      return extractValue(inner);
    });
  }

  // 2. Simple types
  const sMatch = xml.match(/<string>([\s\S]*?)<\/string>/);
  if (sMatch) return sMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  
  const iMatch = xml.match(/<int>(-?\d+)<\/int>/);
  if (iMatch) return parseInt(iMatch[1], 10);
  
  const bMatch = xml.match(/<boolean>([01])<\/boolean>/);
  if (bMatch) return bMatch[1] === '1';

  const dMatch = xml.match(/<double>([\d.]+)<\/double>/);
  if (dMatch) return parseFloat(dMatch[1]);

  return null;
}

function getMemberValueXml(memberXml: string): string {
  const nameEndTag = '</name>';
  const memberEndTag = '</member>';
  const startIdx = memberXml.indexOf(nameEndTag);
  const endIdx = memberXml.lastIndexOf(memberEndTag);
  if (startIdx === -1 || endIdx === -1) return '';
  
  const content = memberXml.substring(startIdx + nameEndTag.length, endIdx).trim();
  // Strip outer <value> and </value> if present
  const match = content.match(/^<value>([\s\S]*)<\/value>$/);
  return match ? match[1].trim() : content;
}

function parseOdooRecords(xml: string): any[] {
  const records: any[] = [];
  const structMatches = xml.match(/<struct>[\s\S]*?<\/struct>/g) || [];

  for (const struct of structMatches) {
    const obj: any = {};
    const memberMatches = struct.match(/<member>[\s\S]*?<\/member>/g) || [];
    for (const member of memberMatches) {
      const name = member.match(/<name>(.*?)<\/name>/)?.[1];
      if (name) {
        const valXml = getMemberValueXml(member);
        obj[name] = extractValue(valXml);
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
    const rawXml = await execute('crm.lead', 'search_read', [[['active', 'in', [true, false]]]], {
      fields: [
        'id', 'name', 'contact_name', 'email_from', 'phone', 
        'city', 'description', 'stage_id', 'probability', 
        'priority', 'create_date', 'active'
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
        'priority', 'create_date', 'active'
      ]
    });
    const records = parseOdooRecords(rawXml);
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    return null;
  }
}

export async function createOdooLead(data: any) {
  try {
    const resXml = await execute('crm.lead', 'create', [{
      name: data.namaPerusahaan,
      contact_name: data.namaLengkap,
      email_from: data.email,
      phone: data.telepon,
      city: data.kota,
      description: data.catatan || '',
      type: 'opportunity',
      priority: data.priority || '1'
    }]);
    const match = resXml.match(/<int>(\d+)<\/int>/);
    return match ? { success: true, id: match[1] } : { success: false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOdooLeadStage(leadId: number, stageId: number) {
  try {
    await execute('crm.lead', 'write', [[leadId], { stage_id: stageId, active: true }]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setOdooLeadWon(leadId: number) {
  try {
    await execute('crm.lead', 'action_set_won', [[leadId]]);
    await execute('crm.lead', 'write', [[leadId], { stage_id: 6 }]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setOdooLeadLost(leadId: number) {
  try {
    await execute('crm.lead', 'action_set_lost', [[leadId]]);
    await execute('crm.lead', 'write', [[leadId], { stage_id: 7 }]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncLeadToOdoo(lead: any) {
  if (lead.odooLeadId) return { success: true, odooId: lead.odooLeadId };
  const res = await createOdooLead(lead);
  if (res.success && res.id) {
    return { success: true, odooId: res.id };
  }
  return { success: false, error: res.error || "Gagal sinkronisasi" };
}

export async function updateOdooLeadDetails(leadId: number, data: any) {
  try {
    const odooFields: any = {};
    if (data.namaPerusahaan) odooFields.name = data.namaPerusahaan;
    if (data.namaLengkap) odooFields.contact_name = data.namaLengkap;
    if (data.email !== undefined) odooFields.email_from = data.email;
    if (data.telepon !== undefined) odooFields.phone = data.telepon;
    if (data.kota !== undefined) odooFields.city = data.kota;
    if (data.catatan !== undefined) odooFields.description = data.catatan;

    await execute('crm.lead', 'write', [[leadId], odooFields]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOdooChatterMessages(leadId: number) {
  try {
    const rawXml = await execute('mail.message', 'search_read', [[
      ['model', '=', 'crm.lead'],
      ['res_id', '=', leadId]
    ]], {
      fields: ['id', 'date', 'body', 'message_type', 'subtype_id'],
      order: 'date desc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooChatterMessages failed:', error);
    return [];
  }
}

export async function postOdooChatterMessage(leadId: number, body: string, messageType: string = 'comment') {
  try {
    await execute('crm.lead', 'message_post', [[leadId]], {
      body: body,
      message_type: messageType,
      subtype_xmlid: 'mail.mt_comment'
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOdooActivities(leadId: number) {
  try {
    const rawXml = await execute('mail.activity', 'search_read', [[
      ['res_model', '=', 'crm.lead'],
      ['res_id', '=', leadId]
    ]], {
      fields: ['id', 'activity_type_id', 'summary', 'note', 'date_deadline', 'create_date'],
      order: 'date_deadline asc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooActivities failed:', error);
    return [];
  }
}

export async function scheduleOdooActivity(leadId: number, activityTypeId: number, summary: string, note: string, dateDeadline: string) {
  try {
    await execute('mail.activity', 'create', [{
      res_model_id: 728, // ID of 'crm.lead' model in ir.model
      res_model: 'crm.lead',
      res_id: leadId,
      activity_type_id: activityTypeId,
      summary: summary,
      note: note,
      date_deadline: dateDeadline
    }]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOdooContacts() {
  try {
    const rawXml = await execute('res.partner', 'search_read', [[
      ['active', '=', true]
    ]], {
      fields: ['id', 'name', 'email'],
      limit: 150,
      order: 'name asc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooContacts failed:', error);
    return [];
  }
}

export async function getOdooMailings() {
  try {
    const rawXml = await execute('mailing.mailing', 'search_read', [[]], {
      fields: ['id', 'subject', 'state', 'sent', 'delivered', 'opened', 'clicked', 'body_html', 'campaign_id'],
      limit: 100,
      order: 'id desc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooMailings failed:', error);
    return [];
  }
}

export async function createOdooMailing(subject: string, campaignId: number, bodyHtml: string) {
  try {
    const params: any = {
      subject: subject,
      body_html: bodyHtml,
      state: 'draft',
      mailing_type: 'mail'
    };
    if (campaignId > 0) {
      params.campaign_id = campaignId;
    }
    const rawXml = await execute('mailing.mailing', 'create', [params]);
    return { success: true, data: rawXml };
  } catch (error: any) {
    console.error('createOdooMailing failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getOdooUtmCampaigns() {
  try {
    const rawXml = await execute('utm.campaign', 'search_read', [[]], {
      fields: ['id', 'name', 'title'],
      limit: 100,
      order: 'name asc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooUtmCampaigns failed:', error);
    return [];
  }
}

export async function getOdooInvoices() {
  try {
    const rawXml = await execute('account.move', 'search_read', [[
      ['move_type', '=', 'out_invoice']
    ]], {
      fields: ['id', 'name', 'state', 'payment_state', 'invoice_date', 'invoice_date_due', 'amount_total', 'partner_id'],
      limit: 100,
      order: 'id desc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooInvoices failed:', error);
    return [];
  }
}

export async function createOdooInvoice(partnerId: number, amountTotal: number, invoiceDate: string, invoiceDateDue: string, note: string) {
  try {
    const params: any = {
      move_type: 'out_invoice',
      partner_id: partnerId,
      invoice_date: invoiceDate,
      invoice_date_due: invoiceDateDue,
      narration: note,
      invoice_line_ids: [[0, 0, {
        name: note || 'Pasokan Cokelat Premium VeloCocoa',
        price_unit: amountTotal,
        quantity: 1
      }]]
    };

    const newInvoiceId = await execute('account.move', 'create', [params]);
    return { success: true, data: newInvoiceId };
  } catch (error: any) {
    console.error('createOdooInvoice failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getOdooJournalEntries() {
  try {
    const rawXml = await execute('account.move', 'search_read', [[
      ['move_type', '=', 'entry']
    ]], {
      fields: ['id', 'name', 'ref', 'date', 'amount_total', 'state'],
      limit: 100,
      order: 'id desc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooJournalEntries failed:', error);
    return [];
  }
}

export async function getOdooMailingLists() {
  try {
    const rawXml = await execute('mailing.list', 'search_read', [[]], {
      fields: ['id', 'name', 'contact_count'],
      limit: 100
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooMailingLists failed:', error);
    return [];
  }
}

export async function createOdooMailingList(name: string) {
  try {
    const newListId = await execute('mailing.list', 'create', [{ name }]);
    return { success: true, data: newListId };
  } catch (error: any) {
    console.error('createOdooMailingList failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getOdooMailingContacts() {
  try {
    const rawXml = await execute('mailing.contact', 'search_read', [[]], {
      fields: ['id', 'name', 'email', 'list_ids'],
      limit: 500
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooMailingContacts failed:', error);
    return [];
  }
}

export async function createOdooMailingContact(name: string, email: string, listId: number) {
  try {
    const params = {
      name,
      email,
      list_ids: [[6, 0, [listId]]] // Link relation to list securely
    };
    const newContactId = await execute('mailing.contact', 'create', [params]);
    return { success: true, data: newContactId };
  } catch (error: any) {
    console.error('createOdooMailingContact failed:', error);
    return { success: false, error: error.message };
  }
}



