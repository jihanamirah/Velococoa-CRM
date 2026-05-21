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
        'priority', 'create_date', 'active',
        'campaign_id', 'medium_id', 'source_id', 'referred',
        'street', 'street2', 'zip', 'state_id', 'country_id',
        'function', 'website', 'team_id', 'expected_revenue', 'date_deadline'
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
        'priority', 'create_date', 'active',
        'campaign_id', 'medium_id', 'source_id', 'referred',
        'street', 'street2', 'zip', 'state_id', 'country_id',
        'function', 'website', 'team_id', 'expected_revenue', 'date_deadline'
      ]
    });
    const records = parseOdooRecords(rawXml);
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    return null;
  }
}

function cleanDescriptionLocal(desc: string): string {
  if (!desc) return '';
  let cleaned = desc.replace(/Kota\/Wilayah\s*:\s*.*?(?=\s*(?:Kategori Bisnis|Jumlah Pesanan|$|\n|\r|<))/gi, '');
  cleaned = cleaned.replace(/Kategori Bisnis\s*:\s*.*?(?=\s*(?:Jumlah Pesanan|Kota\/Wilayah|$|\n|\r|<))/gi, '');
  cleaned = cleaned.replace(/Jumlah Pesanan\s*:\s*.*?(?:<br\s*\/?>|<p>|<\/p>|\n|\r|$)/gi, '');
  cleaned = cleaned.replace(/AI Suggested Segment:.*?(?:\n|\r|$)/gi, '');
  cleaned = cleaned.replace(/Reasoning:.*?(?:\n|\r|$)/gi, '');
  cleaned = cleaned.replace(/Other Information\s*:\s*/gi, '');
  cleaned = cleaned.replace(/____+/g, '');
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function buildOdooDescription(fields: {
  kota?: string;
  kategoriBisnis?: string;
  estimasiVolume?: string;
  promoMinat?: string;
  aiSuggestedSegment?: string;
  reasoning?: string;
  catatan?: string;
}): string {
  const parts: string[] = [];
  if (fields.kota) {
    parts.push(`Kota/Wilayah : ${fields.kota}`);
  }
  if (fields.kategoriBisnis) {
    parts.push(`Kategori Bisnis : ${fields.kategoriBisnis}`);
  }
  if (fields.estimasiVolume) {
    parts.push(`Jumlah Pesanan : ${fields.estimasiVolume}`);
  }
  if (fields.promoMinat) {
    parts.push(`Promo Minat : ${fields.promoMinat}`);
  }
  
  if (fields.aiSuggestedSegment) {
    parts.push(`AI Suggested Segment: ${fields.aiSuggestedSegment}`);
  }
  if (fields.reasoning) {
    parts.push(`Reasoning: ${fields.reasoning}`);
  }
  
  if (fields.catatan) {
    if (parts.length > 0) {
      parts.push('');
    }
    parts.push(fields.catatan);
  }
  
  return parts.join('\n');
}

export async function createOdooLead(data: any) {
  try {
    const odooFields: any = {
      name: data.namaPerusahaan,
      contact_name: data.namaLengkap,
      email_from: data.email,
      phone: data.telepon,
      city: data.kota,
      description: buildOdooDescription({
        kota: data.kota,
        kategoriBisnis: data.kategoriBisnis || 'Lainnya',
        estimasiVolume: data.estimasiVolume,
        promoMinat: data.promoMinat,
        catatan: data.catatan
      }),
      type: 'opportunity',
      priority: data.priority || '1'
    };
    
    if (data.expectedRevenue !== undefined && data.expectedRevenue !== '') {
      odooFields.expected_revenue = parseFloat(data.expectedRevenue) || 0;
    }
    if (data.probability !== undefined && data.probability !== '') {
      odooFields.probability = parseFloat(data.probability) || 0;
    }
    if (data.dateDeadline) {
      odooFields.date_deadline = data.dateDeadline;
    }

    const resXml = await execute('crm.lead', 'create', [odooFields]);
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

    // Reconstruct description if any description-based fields or catatan are updated
    const hasDescriptionUpdate = 
      data.kota !== undefined ||
      data.kategoriBisnis !== undefined ||
      data.estimasiVolume !== undefined ||
      data.promoMinat !== undefined ||
      data.catatan !== undefined ||
      data.aiSuggestedSegment !== undefined ||
      data.aiReasoning !== undefined;

    if (hasDescriptionUpdate) {
      const existing = await getOdooLeadById(leadId);
      const desc = existing ? (existing.description || '') : '';

      // Parse existing location (Kota/Wilayah)
      const kotaMatch = desc.match(/Kota\/Wilayah\s*:\s*(.*?)(?=\s*(?:Kategori Bisnis|Jumlah Pesanan|$|\n|\r|<))/i);
      let currentKota = kotaMatch ? kotaMatch[1].trim() : (existing?.city ? String(existing.city) : '');

      // Parse existing category (Kategori Bisnis)
      const katMatch = desc.match(/Kategori Bisnis\s*:\s*(.*?)(?=\s*(?:Jumlah Pesanan|Kota\/Wilayah|$|\n|\r|<))/i);
      let currentKat = katMatch ? katMatch[1].trim() : '';
      if (!currentKat) {
        currentKat = desc.match(/AI Suggested Segment:\s*(.*?)(?:\n|\r|$)/i)?.[1]?.trim() || 'Lainnya';
      }

      // Parse existing volume
      const jmlPesananMatch = desc.match(/Jumlah Pesanan\s*:\s*(.*?)(?:<|$|\n|\r)/i);
      const volumeMatch = desc.match(/Estimasi Volume\s*:\s*(.*?)(?:<|$|\n|\r)/i);
      let currentVolume = '';
      if (jmlPesananMatch && jmlPesananMatch[1].trim()) {
        currentVolume = jmlPesananMatch[1].trim();
      } else if (volumeMatch && volumeMatch[1].trim()) {
        currentVolume = volumeMatch[1].trim();
      }

      // Parse existing promo
      const promoMatch = desc.match(/Promo Minat\s*:\s*(.*?)(?:<|$|\n|\r)/i);
      let currentPromo = promoMatch ? promoMatch[1].trim() : '';

      // Parse AI Suggested Segment & Reasoning
      const aiSegMatch = desc.match(/AI Suggested Segment:\s*(.*?)(?:\n|\r|$)/i);
      let currentAiSeg = aiSegMatch ? aiSegMatch[1].trim() : '';

      const reasoningMatch = desc.match(/Reasoning:\s*(.*?)(?:\n|\r|$)/i);
      let currentReasoning = reasoningMatch ? reasoningMatch[1].trim() : '';

      // Parse existing notes
      const currentCatatan = cleanDescriptionLocal(desc);

      const mergedKota = data.kota !== undefined ? data.kota : currentKota;
      const mergedKat = data.kategoriBisnis !== undefined ? data.kategoriBisnis : currentKat;
      const mergedVolume = data.estimasiVolume !== undefined ? data.estimasiVolume : currentVolume;
      const mergedPromo = data.promoMinat !== undefined ? data.promoMinat : currentPromo;
      const mergedCatatan = data.catatan !== undefined ? data.catatan : currentCatatan;
      const mergedAiSeg = data.aiSuggestedSegment !== undefined ? data.aiSuggestedSegment : currentAiSeg;
      const mergedReasoning = data.aiReasoning !== undefined ? data.aiReasoning : currentReasoning;

      odooFields.description = buildOdooDescription({
        kota: mergedKota,
        kategoriBisnis: mergedKat,
        estimasiVolume: mergedVolume,
        promoMinat: mergedPromo,
        aiSuggestedSegment: mergedAiSeg,
        reasoning: mergedReasoning,
        catatan: mergedCatatan
      });
    }

    if (data.street !== undefined) odooFields.street = data.street;
    if (data.street2 !== undefined) odooFields.street2 = data.street2;
    if (data.zip !== undefined) odooFields.zip = data.zip;
    if (data.stateId !== undefined) odooFields.state_id = data.stateId || false;
    if (data.countryId !== undefined) odooFields.country_id = data.countryId || false;
    if (data.jobPosition !== undefined) odooFields.function = data.jobPosition;
    if (data.website !== undefined) odooFields.website = data.website;
    if (data.campaignId !== undefined) odooFields.campaign_id = data.campaignId || false;
    if (data.mediumId !== undefined) odooFields.medium_id = data.mediumId || false;
    if (data.sourceId !== undefined) odooFields.source_id = data.sourceId || false;
    if (data.referred !== undefined) odooFields.referred = data.referred;
    if (data.salesTeamId !== undefined) odooFields.team_id = data.salesTeamId || false;
    if (data.expectedRevenue !== undefined) odooFields.expected_revenue = data.expectedRevenue;
    if (data.probability !== undefined) odooFields.probability = data.probability;
    if (data.dateDeadline !== undefined) odooFields.date_deadline = data.dateDeadline || false;

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
      fields: ['id', 'subject', 'state', 'sent', 'delivered', 'opened', 'clicked', 'body_html', 'campaign_id', 'user_id'],
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
    const [rawCampaigns, rawTags, rawStages] = await Promise.all([
      execute('utm.campaign', 'search_read', [[]], {
        fields: ['id', 'name', 'title', 'stage_id', 'tag_ids', 'mailing_mail_count', 'invoiced_amount', 'user_id'],
        limit: 100
      }),
      execute('utm.tag', 'search_read', [[]], {
        fields: ['id', 'name']
      }),
      execute('utm.stage', 'search_read', [[]], {
        fields: ['id', 'name']
      })
    ]);

    return {
      campaigns: parseOdooRecords(rawCampaigns),
      tags: parseOdooRecords(rawTags),
      stages: parseOdooRecords(rawStages)
    };
  } catch (error) {
    console.error('getOdooUtmCampaigns failed:', error);
    return { campaigns: [], tags: [], stages: [] };
  }
}

export async function updateOdooUtmCampaignStage(campaignId: number, stageId: number) {
  try {
    await execute('utm.campaign', 'write', [[campaignId], { stage_id: stageId }]);
    return { success: true };
  } catch (error: any) {
    console.error('updateOdooUtmCampaignStage failed:', error);
    return { success: false, error: error.message };
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

export async function createOdooInvoice(
  partnerId: number, 
  amountTotal: number, 
  invoiceDate: string, 
  invoiceDateDue: string, 
  note: string,
  productId?: number,
  quantity?: number,
  confirmAndPost?: boolean
) {
  try {
    const params: any = {
      move_type: 'out_invoice',
      partner_id: partnerId,
      invoice_date: invoiceDate,
      invoice_date_due: invoiceDateDue,
      narration: note
    };

    if (productId && quantity) {
      params.invoice_line_ids = [[0, 0, {
        product_id: productId,
        name: note || 'Pasokan Cokelat Premium VeloCocoa',
        price_unit: amountTotal / quantity,
        quantity: quantity
      }]];
    } else {
      params.invoice_line_ids = [[0, 0, {
        name: note || 'Pasokan Cokelat Premium VeloCocoa',
        price_unit: amountTotal,
        quantity: 1
      }]]
    }

    const newInvoiceId = await execute('account.move', 'create', [params]);
    
    if (confirmAndPost) {
      // Auto confirm/post draft invoice in Odoo
      await execute('account.move', 'action_post', [[newInvoiceId]]);
    }

    return { success: true, data: newInvoiceId };
  } catch (error: any) {
    console.error('createOdooInvoice failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getOdooProducts() {
  try {
    const rawXml = await execute('product.product', 'search_read', [
      [['sale_ok', '=', true]], // Fetch only sellable products
      ['id', 'name', 'lst_price', 'default_code']
    ]);
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooProducts failed:', error);
    return [];
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

export async function createOdooUtmCampaign(title: string, name: string) {
  try {
    const params = {
      title,
      name
    };
    const resXml = await execute('utm.campaign', 'create', [params]);
    const match = resXml.match(/<int>(\d+)<\/int>/);
    const newUtmId = match ? parseInt(match[1], 10) : null;
    return { success: !!newUtmId, data: newUtmId };
  } catch (error: any) {
    console.error('createOdooUtmCampaign failed:', error);
    return { success: false, error: error.message };
  }
}

export async function createOdooUtmMedium(name: string) {
  try {
    const params = { name };
    const resXml = await execute('utm.medium', 'create', [params]);
    const match = resXml.match(/<int>(\d+)<\/int>/);
    const newMediumId = match ? parseInt(match[1], 10) : null;
    return { success: !!newMediumId, data: newMediumId };
  } catch (error: any) {
    console.error('createOdooUtmMedium failed:', error);
    return { success: false, error: error.message };
  }
}

export async function createOdooUtmSource(name: string) {
  try {
    const params = { name };
    const resXml = await execute('utm.source', 'create', [params]);
    const match = resXml.match(/<int>(\d+)<\/int>/);
    const newSourceId = match ? parseInt(match[1], 10) : null;
    return { success: !!newSourceId, data: newSourceId };
  } catch (error: any) {
    console.error('createOdooUtmSource failed:', error);
    return { success: false, error: error.message };
  }
}

export async function payOdooInvoice(invoiceId: number, amount: number, paymentDate: string, journalType: 'bank' | 'cash') {
  try {
    // 1. Find journal_id of specified type (bank or cash)
    const journals = await execute('account.journal', 'search_read', [
      [['type', '=', journalType === 'bank' ? 'bank' : 'cash']],
      ['id', 'name']
    ]);
    
    if (journals.length === 0) {
      throw new Error(`Odoo journal of type ${journalType} not found.`);
    }
    const journalId = journals[0].id;

    // 2. Create the account.payment.register wizard record
    const context = {
      active_model: 'account.move',
      active_ids: [invoiceId]
    };

    // Get the default values from context to fetch linked receivable line_ids
    const defaultFields = ['line_ids'];
    const defaultVals = await execute('account.payment.register', 'default_get', [defaultFields], { context });
    const lineIds = defaultVals?.line_ids || [];

    const wizardId = await execute('account.payment.register', 'create', [{
      payment_date: paymentDate,
      journal_id: journalId,
      amount: amount,
      line_ids: lineIds
    }], { context });

    // 3. Confirm payment to reconcile invoice
    await execute('account.payment.register', 'action_create_payments', [[wizardId]], { context });

    return { success: true };
  } catch (error: any) {
    console.error('payOdooInvoice failed:', error);
    return { success: false, error: error.message };
  }
}

export async function postOdooInvoice(invoiceId: number) {
  try {
    await execute('account.move', 'action_post', [[invoiceId]]);
    return { success: true };
  } catch (error: any) {
    console.error('postOdooInvoice failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getOdooUtmMediums() {
  try {
    const rawXml = await execute('utm.medium', 'search_read', [[]], {
      fields: ['id', 'name'],
      limit: 100
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooUtmMediums failed:', error);
    return [];
  }
}

export async function getOdooUtmSources() {
  try {
    const rawXml = await execute('utm.source', 'search_read', [[]], {
      fields: ['id', 'name'],
      limit: 200
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooUtmSources failed:', error);
    return [];
  }
}

export async function getOdooCountries() {
  try {
    const rawXml = await execute('res.country', 'search_read', [[]], {
      fields: ['id', 'name', 'code'],
      limit: 300
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooCountries failed:', error);
    return [];
  }
}

export async function getOdooStates(countryId?: number) {
  try {
    const domain = countryId ? [['country_id', '=', countryId]] : [];
    const rawXml = await execute('res.country.state', 'search_read', [domain], {
      fields: ['id', 'name', 'code', 'country_id'],
      limit: 500
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooStates failed:', error);
    return [];
  }
}

export async function getOdooSalesTeams() {
  try {
    const rawXml = await execute('crm.team', 'search_read', [[]], {
      fields: ['id', 'name'],
      limit: 100
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooSalesTeams failed:', error);
    return [];
  }
}

export async function findOrCreateUtmRecord(model: 'utm.campaign' | 'utm.medium' | 'utm.source', name: string) {
  try {
    const rawXml = await execute(model, 'search_read', [[['name', '=ilike', name.trim()]]], {
      fields: ['id', 'name'],
      limit: 1
    });
    const records = parseOdooRecords(rawXml);
    if (records.length > 0) {
      return { success: true, id: records[0].id, name: records[0].name };
    }
    
    // Create new
    let res;
    if (model === 'utm.campaign') {
      const sanitizedName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      res = await createOdooUtmCampaign(name, sanitizedName);
    } else if (model === 'utm.medium') {
      res = await createOdooUtmMedium(name);
    } else {
      res = await createOdooUtmSource(name);
    }
    
    if (res.success && res.data) {
      return { success: true, id: res.data, name: name };
    }
    return { success: false, error: res.error || 'Gagal membuat UTM record' };
  } catch (error: any) {
    console.error(`findOrCreateUtmRecord for ${model} failed:`, error);
    return { success: false, error: error.message };
  }
}

export async function getOdooQuotations(opportunityId?: number) {
  try {
    const domain = opportunityId ? [['opportunity_id', '=', opportunityId]] : [];
    const rawXml = await execute('sale.order', 'search_read', [domain], {
      fields: ['id', 'name', 'partner_id', 'validity_date', 'payment_term_id', 'amount_untaxed', 'amount_tax', 'amount_total', 'state', 'opportunity_id', 'order_line'],
      limit: 150,
      order: 'id desc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooQuotations failed:', error);
    return [];
  }
}

export async function getOdooQuotationById(id: number) {
  try {
    const rawXml = await execute('sale.order', 'read', [[id]], {
      fields: ['id', 'name', 'partner_id', 'validity_date', 'payment_term_id', 'amount_untaxed', 'amount_tax', 'amount_total', 'state', 'opportunity_id', 'order_line']
    });
    const records = parseOdooRecords(rawXml);
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error('getOdooQuotationById failed:', error);
    return null;
  }
}

export async function getOdooQuotationLines(lineIds: number[]) {
  try {
    if (!lineIds || lineIds.length === 0) return [];
    const rawXml = await execute('sale.order.line', 'read', [lineIds], {
      fields: ['id', 'order_id', 'product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal']
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooQuotationLines failed:', error);
    return [];
  }
}

export async function createOdooQuotation(data: any) {
  try {
    const params: any = {
      partner_id: data.partnerId,
      validity_date: data.validityDate || false,
      payment_term_id: data.paymentTermId || false,
    };
    if (data.opportunityId) {
      params.opportunity_id = data.opportunityId;
    }
    if (data.orderLines && data.orderLines.length > 0) {
      params.order_line = data.orderLines.map((line: any) => [0, 0, {
        product_id: line.productId,
        product_uom_qty: line.quantity || 1,
        price_unit: line.priceUnit || 0,
        name: line.name || ''
      }]);
    }
    const resXml = await execute('sale.order', 'create', [params]);
    const match = resXml.match(/<int>(\d+)<\/int>/);
    const newId = match ? parseInt(match[1], 10) : null;
    return { success: !!newId, id: newId };
  } catch (error: any) {
    console.error('createOdooQuotation failed:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOdooQuotation(id: number, data: any) {
  try {
    const params: any = {};
    if (data.partnerId !== undefined) params.partner_id = data.partnerId;
    if (data.validityDate !== undefined) params.validity_date = data.validityDate || false;
    if (data.paymentTermId !== undefined) params.payment_term_id = data.paymentTermId || false;
    if (data.state !== undefined) params.state = data.state;

    if (data.orderLines !== undefined) {
      const linesParam: any[] = [[5, 0, 0]];
      data.orderLines.forEach((line: any) => {
        linesParam.push([0, 0, {
          product_id: line.productId,
          product_uom_qty: line.quantity || 1,
          price_unit: line.priceUnit || 0,
          name: line.name || ''
        }]);
      });
      params.order_line = linesParam;
    }

    await execute('sale.order', 'write', [[id], params]);
    return { success: true };
  } catch (error: any) {
    console.error('updateOdooQuotation failed:', error);
    return { success: false, error: error.message };
  }
}

export async function confirmOdooQuotation(id: number) {
  try {
    await execute('sale.order', 'action_confirm', [[id]]);
    return { success: true };
  } catch (error: any) {
    console.error('confirmOdooQuotation failed:', error);
    return { success: false, error: error.message };
  }
}

export async function cancelOdooQuotation(id: number) {
  try {
    await execute('sale.order', 'action_cancel', [[id]]);
    return { success: true };
  } catch (error: any) {
    console.error('cancelOdooQuotation failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getOdooPaymentTerms() {
  try {
    const rawXml = await execute('account.payment.term', 'search_read', [[]], {
      fields: ['id', 'name'],
      limit: 100,
      order: 'id asc'
    });
    return parseOdooRecords(rawXml);
  } catch (error) {
    console.error('getOdooPaymentTerms failed:', error);
    return [];
  }
}

export async function createOdooContact(name: string, email?: string, phone?: string) {
  try {
    const params: any = {
      name: name,
      email: email || false,
      phone: phone || false,
    };
    const resXml = await execute('res.partner', 'create', [params]);
    const match = resXml.match(/<int>(\d+)<\/int>/);
    const newId = match ? parseInt(match[1], 10) : null;
    return { success: !!newId, id: newId };
  } catch (error: any) {
    console.error('createOdooContact failed:', error);
    return { success: false, error: error.message };
  }
}
