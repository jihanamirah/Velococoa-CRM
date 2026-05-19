/**
 * @fileOverview Adapter layer between Odoo ERP and VeloCocoa CRM UI.
 */

import { 
  getOdooLeads, 
  getOdooStages, 
  getOdooLeadById,
  createOdooLead, 
  updateOdooLeadStage, 
  setOdooLeadWon, 
  setOdooLeadLost,
  updateOdooLeadDetails,
  getOdooChatterMessages,
  postOdooChatterMessage,
  getOdooActivities,
  scheduleOdooActivity,
  getOdooContacts,
  getOdooMailings,
  createOdooMailing,
  getOdooUtmCampaigns,
  getOdooInvoices,
  createOdooInvoice,
  getOdooJournalEntries,
  getOdooMailingLists,
  createOdooMailingList,
  getOdooMailingContacts,
  createOdooMailingContact,
  createOdooUtmCampaign,
  getOdooProducts,
  payOdooInvoice,
  postOdooInvoice,
  updateOdooUtmCampaignStage
} from '@/services/odoo';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface OdooStage {
  id: number;
  name: string;
  sequence: number;
}

export type LeadStatus = 'Baru' | 'Dihubungi' | 'Negotiation' | 'Qualified' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  namaLengkap: string;
  namaPerusahaan: string;
  email: string;
  telepon: string;
  kota: string;
  kategoriBisnis: string;
  status: string;
  stageId: number;
  probability: number;
  active: boolean;
  sudahSyncOdoo: boolean;
  odooLeadId: string;
  aiSuggestedSegment: string;
  aiFollowUpPriority: string;
  aiReasoning: string;
  catatan: string;
  catatanInternal: string;
  sumber: string;
  createdAt: string;
  promoMinat?: string;
  estimasiVolume?: string;
  campaignId?: number;
  campaignName?: string;
  mediumId?: number;
  mediumName?: string;
  sourceId?: number;
  sourceName?: string;
  referred?: string;
}

function cleanDescription(desc: string): string {
  if (!desc) return '';
  // 1. Remove "Kota/Wilayah : ..." up to next field or tag
  let cleaned = desc.replace(/Kota\/Wilayah\s*:\s*.*?(?=\s*(?:Kategori Bisnis|Jumlah Pesanan|$|\n|\r|<))/gi, '');
  // 2. Remove "Kategori Bisnis : ..." up to next field or tag
  cleaned = cleaned.replace(/Kategori Bisnis\s*:\s*.*?(?=\s*(?:Jumlah Pesanan|Kota\/Wilayah|$|\n|\r|<))/gi, '');
  // 3. Remove "Jumlah Pesanan : [value]"
  cleaned = cleaned.replace(/Jumlah Pesanan\s*:\s*.*?(?:<br\s*\/?>|<p>|<\/p>|\n|\r|$)/gi, '');
  // 4. Remove AI Suggested Segment lines
  cleaned = cleaned.replace(/AI Suggested Segment:.*?(?:\n|\r|$)/gi, '');
  cleaned = cleaned.replace(/Reasoning:.*?(?:\n|\r|$)/gi, '');
  // 5. Remove "Other Information:" or lines of underscores
  cleaned = cleaned.replace(/Other Information\s*:\s*/gi, '');
  cleaned = cleaned.replace(/____+/g, '');
  // 6. Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  // 7. Clean up multiple spaces or newlines
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function mapOdooToLead(odoo: any): Lead {
  const description = String(odoo.description || '');
  const stageData = Array.isArray(odoo.stage_id) ? odoo.stage_id : [0, 'Unassigned'];

  let mappedStatus = stageData[1];
  const stageId = stageData[0];
  const odooStageName = stageData[1].toLowerCase();
  
  if (stageId === 1 || odooStageName.includes('new') || odooStageName.includes('baru')) {
    mappedStatus = 'Baru';
  } else if (stageId === 2 || odooStageName.includes('contact') || odooStageName.includes('hubungi')) {
    mappedStatus = 'Dihubungi';
  } else if (stageId === 3 || odooStageName.includes('negotiat') || odooStageName.includes('negosiasi')) {
    mappedStatus = 'Negotiation';
  } else if (stageId === 4 || odooStageName.includes('qualif')) {
    mappedStatus = 'Qualified';
  } else if (stageId === 6 || odooStageName.includes('won') || odooStageName.includes('berhasil')) {
    mappedStatus = 'Won';
  } else if (stageId === 7 || odooStageName.includes('lost') || odooStageName.includes('gagal')) {
    mappedStatus = 'Lost';
  }

  // Override status mapping based strictly on active field to ensure Lost leads map correctly
  if (odoo.active === false) {
    mappedStatus = 'Lost';
  }

  // Parse location (Kota/Wilayah) from description or fallback to odoo city
  const kotaMatch = description.match(/Kota\/Wilayah\s*:\s*(.*?)(?=\s*(?:Kategori Bisnis|Jumlah Pesanan|$|\n|\r|<))/i);
  let parsedKota = odoo.city ? String(odoo.city) : '';
  if (kotaMatch && kotaMatch[1].trim()) {
    parsedKota = kotaMatch[1].trim();
  }

  // Parse category (Kategori Bisnis) from description or fallback to suggested segment
  const katMatch = description.match(/Kategori Bisnis\s*:\s*(.*?)(?=\s*(?:Jumlah Pesanan|Kota\/Wilayah|$|\n|\r|<))/i);
  let parsedKat = description.match(/AI Suggested Segment: (.*?)\n/)?.[1] || 'Lainnya';
  if (katMatch && katMatch[1].trim()) {
    parsedKat = katMatch[1].trim();
  }

  // Parse volume and promo from description (HTML or text)
  const jmlPesananMatch = description.match(/Jumlah Pesanan\s*:\s*(.*?)(?:<|$|\n|\r)/i);
  const volumeMatch = description.match(/Estimasi Volume\s*:\s*(.*?)(?:<|$|\n|\r)/i);
  let parsedVolume = 'Belum diketahui';
  if (jmlPesananMatch && jmlPesananMatch[1].trim()) {
    parsedVolume = jmlPesananMatch[1].trim();
  } else if (volumeMatch && volumeMatch[1].trim()) {
    parsedVolume = volumeMatch[1].trim();
  }

  const promoMatch = description.match(/Promo Minat\s*:\s*(.*?)(?:<|$|\n|\r)/i);
  let parsedPromo = 'Tidak ada promo spesifik';
  if (promoMatch && promoMatch[1].trim()) {
    parsedPromo = promoMatch[1].trim();
  }

  return {
    id: String(odoo.id),
    namaLengkap: String(odoo.contact_name || 'Tanpa Nama'),
    namaPerusahaan: String(odoo.name || 'Opportunity'),
    email: String(odoo.email_from || ''),
    telepon: String(odoo.phone || ''),
    kota: parsedKota,
    kategoriBisnis: parsedKat,
    status: mappedStatus,
    stageId: stageData[0],
    probability: Number(odoo.probability || 0),
    active: odoo.active !== false,
    sudahSyncOdoo: true,
    odooLeadId: String(odoo.id),
    aiSuggestedSegment: description.match(/AI Suggested Segment: (.*?)\n/)?.[1] || 'Lainnya',
    aiFollowUpPriority: odoo.priority === '3' ? 'High' : odoo.priority === '2' ? 'Medium' : 'Low',
    aiReasoning: description.match(/Reasoning: (.*?)\n/)?.[1] || '',
    catatan: cleanDescription(description),
    catatanInternal: '',
    sumber: 'Odoo CRM',
    createdAt: String(odoo.create_date || new Date().toISOString()),
    estimasiVolume: parsedVolume,
    promoMinat: parsedPromo,
    campaignId: Array.isArray(odoo.campaign_id) ? Number(odoo.campaign_id[0]) : undefined,
    campaignName: Array.isArray(odoo.campaign_id) ? String(odoo.campaign_id[1]) : undefined,
    mediumId: Array.isArray(odoo.medium_id) ? Number(odoo.medium_id[0]) : undefined,
    mediumName: Array.isArray(odoo.medium_id) ? String(odoo.medium_id[1]) : undefined,
    sourceId: Array.isArray(odoo.source_id) ? Number(odoo.source_id[0]) : undefined,
    sourceName: Array.isArray(odoo.source_id) ? String(odoo.source_id[1]) : undefined,
    referred: odoo.referred ? String(odoo.referred) : undefined
  };
}

export async function getLeads(): Promise<Lead[]> {
  const odooLeads = await getOdooLeads();
  return odooLeads.map(mapOdooToLead);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const odooLead = await getOdooLeadById(parseInt(id, 10));
  return odooLead ? mapOdooToLead(odooLead) : null;
}

export async function getStages(): Promise<OdooStage[]> {
  const stages = await getOdooStages();
  return stages.map(s => ({
    id: s.id,
    name: s.name,
    sequence: s.sequence
  }));
}

export async function moveLeadToStage(leadId: string, stageId: number) {
  return await updateOdooLeadStage(parseInt(leadId, 10), stageId);
}

export async function markWon(leadId: string) {
  return await updateLeadStatus(leadId, 'Won');
}

export async function markLost(leadId: string) {
  return await updateLeadStatus(leadId, 'Lost');
}

export async function updateLeadStatus(leadId: string, newStatus: LeadStatus): Promise<Lead | null> {
  const idInt = parseInt(leadId, 10);
  let success = false;
  
  if (newStatus === 'Won') {
    const res = await setOdooLeadWon(idInt);
    success = res.success;
  } else if (newStatus === 'Lost') {
    const res = await setOdooLeadLost(idInt);
    success = res.success;
  } else {
    const stages = await getStages();
    let searchQuery = newStatus.toLowerCase();
    if (newStatus === 'Baru') searchQuery = 'new';
    else if (newStatus === 'Dihubungi') searchQuery = 'contact';
    else if (newStatus === 'Negotiation') searchQuery = 'negotiat';
    else if (newStatus === 'Qualified') searchQuery = 'qualif';

    const target = stages.find(s => s.name.toLowerCase().includes(searchQuery));
    if (target) {
      const res = await updateOdooLeadStage(idInt, target.id);
      success = res.success;
    }
  }

  // Sync to Firestore if status updated successfully in Odoo
  if (success) {
    try {
      const leadsRef = collection(db, "leads");
      const q = query(leadsRef, where("odooLeadId", "==", leadId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        const leadDocRef = doc(db, "leads", docId);
        await updateDoc(leadDocRef, {
          status: newStatus,
          updatedAt: new Date()
        });
        console.log(`Firestore lead document ${docId} status updated to ${newStatus}`);
      } else {
        console.log(`No Firestore lead document found matching odooLeadId: ${leadId}`);
      }
    } catch (fsError) {
      console.warn("Failed to update Firestore lead status (Firebase might not be configured/online yet):", fsError);
    }
  }

  if (success) {
    const updatedLead = await getLeadById(leadId);
    if (updatedLead && (newStatus === 'Won' || newStatus === 'Lost')) {
      try {
        await addDoc(collection(db, "notifications"), {
          type: 'keputusan',
          title: newStatus === 'Won' ? 'Mitra Berhasil Didapatkan! 🏆' : 'Lead Ditandai Gagal ❌',
          body: `${updatedLead.namaLengkap} (${updatedLead.namaPerusahaan}) telah ditandai sebagai ${newStatus}.`,
          createdAt: new Date(),
          read: false,
          color: newStatus === 'Won' ? 'text-primary bg-primary/10' : 'text-red-500 bg-red-500/10'
        });
      } catch (err) {
        console.warn("Failed to create status notification:", err);
      }
    }
    return updatedLead;
  }
  return null;
}

export async function createLead(input: any): Promise<any> {
  const odooRes = await createOdooLead(input);
  if (odooRes && odooRes.success && odooRes.id) {
    try {
      await addDoc(collection(db, "leads"), {
        namaLengkap: input.namaLengkap || "",
        namaPerusahaan: input.namaPerusahaan || "",
        email: input.email || "",
        telepon: input.telepon || "",
        kota: input.kota || "",
        kategoriBisnis: input.kategoriBisnis || "Lainnya",
        promoMinat: input.promoMinat || "",
        estimasiVolume: input.estimasiVolume || "",
        catatan: input.catatan || "",
        status: "Baru",
        sumber: input.sumber || "Langsung",
        sudahSyncOdoo: true,
        odooLeadId: String(odooRes.id),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Firestore lead document created successfully with odooLeadId: ${odooRes.id}`);
      
      // Also create a real-time notification
      try {
        await addDoc(collection(db, "notifications"), {
          type: 'lead_baru',
          title: 'Lead Baru Masuk!',
          body: `${input.namaLengkap || "Mitra Baru"} - ${input.namaPerusahaan || "Opportunity"}`,
          createdAt: new Date(),
          read: false,
          color: 'text-blue-500 bg-blue-500/10'
        });
      } catch (notifErr) {
        console.warn("Failed to create notification:", notifErr);
      }
    } catch (fsError) {
      console.warn("Failed to create Firestore lead document (Firebase might not be configured/online yet):", fsError);
    }
  }
  return odooRes;
}

export async function updateLeadDetails(leadId: string, updates: Partial<Lead>): Promise<Lead | null> {
  const idInt = parseInt(leadId, 10);
  
  // 1. Sync to Odoo CRM
  const odooRes = await updateOdooLeadDetails(idInt, updates);
  if (!odooRes.success) {
    console.error("Failed to update lead details in Odoo:", odooRes.error);
  }

  // 2. Sync to Firestore
  try {
    const leadsRef = collection(db, "leads");
    const q = query(leadsRef, where("odooLeadId", "==", leadId));
    const querySnapshot = await getDocs(q);
    
    const fsUpdates: any = {
      updatedAt: new Date()
    };
    if (updates.namaLengkap !== undefined) fsUpdates.namaLengkap = updates.namaLengkap;
    if (updates.namaPerusahaan !== undefined) fsUpdates.namaPerusahaan = updates.namaPerusahaan;
    if (updates.email !== undefined) fsUpdates.email = updates.email;
    if (updates.telepon !== undefined) fsUpdates.telepon = updates.telepon;
    if (updates.kota !== undefined) fsUpdates.kota = updates.kota;
    if (updates.kategoriBisnis !== undefined) fsUpdates.kategoriBisnis = updates.kategoriBisnis;
    if (updates.catatan !== undefined) fsUpdates.catatan = updates.catatan;
    if (updates.catatanInternal !== undefined) fsUpdates.catatanInternal = updates.catatanInternal;

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      const leadDocRef = doc(db, "leads", docId);
      await updateDoc(leadDocRef, fsUpdates);
      console.log(`Firestore lead document ${docId} details updated successfully.`);
    }
  } catch (fsError) {
    console.warn("Failed to update Firestore lead details:", fsError);
  }

  return await getLeadById(leadId);
}

export async function getCommunicationLogs(leadId: string) {
  const idInt = parseInt(leadId, 10);
  const messages = await getOdooChatterMessages(idInt);
  return messages.map(m => {
    // Determine activity label based on message_type and content
    let type = 'NOTE';
    const bodyText = m.body ? String(m.body).toLowerCase() : '';
    if (bodyText.includes('whatsapp') || bodyText.includes('wa.me')) type = 'WHATSAPP';
    else if (bodyText.includes('call') || bodyText.includes('telepon') || bodyText.includes('panggilan')) type = 'CALL';
    else if (m.message_type === 'email' || bodyText.includes('email') || bodyText.includes('mailto')) type = 'EMAIL';
    else if (bodyText.includes('meeting') || bodyText.includes('rapat') || bodyText.includes('jadwal')) type = 'MEETING';

    return {
      id: String(m.id || Math.random()),
      date: String(m.date || new Date().toISOString()),
      body: String(m.body || '').replace(/<[^>]*>/g, '').trim(), // Strip HTML
      type: type as 'EMAIL' | 'CALL' | 'WHATSAPP' | 'MEETING' | 'NOTE'
    };
  });
}

export async function addCommunicationLog(leadId: string, body: string) {
  const idInt = parseInt(leadId, 10);
  return await postOdooChatterMessage(idInt, body);
}

export async function getScheduledActivities(leadId: string) {
  const idInt = parseInt(leadId, 10);
  const activities = await getOdooActivities(idInt);
  return activities.map(act => {
    const typeName = Array.isArray(act.activity_type_id) ? String(act.activity_type_id[1]) : 'Activity';
    return {
      id: String(act.id || Math.random()),
      summary: String(act.summary || 'Aktivitas Terjadwal'),
      note: String(act.note || '').replace(/<[^>]*>/g, '').trim(),
      deadline: String(act.date_deadline || ''),
      createDate: String(act.create_date || ''),
      type: typeName.toUpperCase() as 'MEETING' | 'EMAIL' | 'CALL' | 'TO-DO'
    };
  });
}

export async function createScheduledActivity(
  leadId: string, 
  activityTypeId: number, 
  summary: string, 
  note: string, 
  deadline: string
) {
  const idInt = parseInt(leadId, 10);
  return await scheduleOdooActivity(idInt, activityTypeId, summary, note, deadline);
}

export async function getContacts() {
  const partners = await getOdooContacts();
  return partners.map(p => ({
    id: String(p.id || ''),
    name: String(p.name || 'Kontak Tanpa Nama'),
    email: String(p.email || '')
  }));
}

export async function getMailings() {
  const mailings = await getOdooMailings();
  return mailings.map(m => {
    const campaignName = Array.isArray(m.campaign_id) ? String(m.campaign_id[1]) : '';
    const campaignId = Array.isArray(m.campaign_id) ? Number(m.campaign_id[0]) : 0;
    
    return {
      id: String(m.id || ''),
      subject: String(m.subject || 'Tanpa Subjek'),
      state: String(m.state || 'draft'),
      sent: Number(m.sent || 0),
      delivered: Number(m.delivered || 0),
      opened: Number(m.opened || 0),
      clicked: Number(m.clicked || 0),
      bodyHtml: String(m.body_html || ''),
      campaignId: campaignId,
      campaignName: campaignName,
      userId: m.user_id || undefined
    };
  });
}

export async function createMailing(subject: string, campaignId: number, bodyHtml: string) {
  return await createOdooMailing(subject, campaignId, bodyHtml);
}

export async function getUtmCampaigns() {
  const data = await getOdooUtmCampaigns();
  const rawCampaigns = Array.isArray(data) ? data : (data.campaigns || []);
  return rawCampaigns.map((c: any) => ({
    id: String(c.id || ''),
    name: String(c.name || ''),
    title: String(c.title || c.name || ''),
    stage_id: c.stage_id || undefined,
    tag_ids: c.tag_ids || [],
    mailing_mail_count: Number(c.mailing_mail_count || 0),
    invoiced_amount: Number(c.invoiced_amount || 0),
    user_id: c.user_id || undefined
  }));
}

export async function getUtmCampaignsKanban() {
  const data = await getOdooUtmCampaigns();
  
  if (Array.isArray(data)) {
    return {
      campaigns: data.map(c => ({
        id: String(c.id || ''),
        name: String(c.name || ''),
        title: String(c.title || c.name || ''),
        stage_id: c.stage_id || undefined,
        tag_ids: c.tag_ids || [],
        mailing_mail_count: Number(c.mailing_mail_count || 0),
        invoiced_amount: Number(c.invoiced_amount || 0),
        user_id: c.user_id || undefined
      })),
      tags: [],
      stages: []
    };
  }

  const campaigns = (data.campaigns || []).map((c: any) => ({
    id: String(c.id || ''),
    name: String(c.name || ''),
    title: String(c.title || c.name || ''),
    stage_id: c.stage_id || undefined,
    tag_ids: c.tag_ids || [],
    mailing_mail_count: Number(c.mailing_mail_count || 0),
    invoiced_amount: Number(c.invoiced_amount || 0),
    user_id: c.user_id || undefined
  }));

  const tags = (data.tags || []).map((t: any) => ({
    id: Number(t.id),
    name: String(t.name)
  }));

  const stages = (data.stages || []).map((s: any) => ({
    id: Number(s.id),
    name: String(s.name)
  }));

  return {
    campaigns,
    tags,
    stages
  };
}

export async function updateUtmCampaignStage(campaignId: number, stageId: number) {
  return await updateOdooUtmCampaignStage(campaignId, stageId);
}

export async function getInvoices() {
  const invoices = await getOdooInvoices();
  return invoices.map(inv => {
    const partnerName = Array.isArray(inv.partner_id) ? String(inv.partner_id[1]) : 'Mitra Umum';
    const partnerId = Array.isArray(inv.partner_id) ? Number(inv.partner_id[0]) : 0;
    
    return {
      id: String(inv.id || ''),
      name: String(inv.name || 'INV/DRAFT'),
      state: String(inv.state || 'draft'),
      paymentState: String(inv.payment_state || 'not_paid'),
      invoiceDate: String(inv.invoice_date || ''),
      invoiceDateDue: String(inv.invoice_date_due || ''),
      amountTotal: Number(inv.amount_total || 0),
      partnerId: partnerId,
      partnerName: partnerName
    };
  });
}

export async function createInvoice(
  partnerId: number, 
  amountTotal: number, 
  invoiceDate: string, 
  invoiceDateDue: string, 
  note: string,
  productId?: number,
  quantity?: number,
  confirmAndPost?: boolean
) {
  return await createOdooInvoice(
    partnerId, 
    amountTotal, 
    invoiceDate, 
    invoiceDateDue, 
    note,
    productId,
    quantity,
    confirmAndPost
  );
}

export async function getProducts() {
  const rawProducts = await getOdooProducts();
  return rawProducts.map((p: any) => ({
    id: String(p.id || ''),
    name: String(p.name || ''),
    price: parseFloat(p.lst_price || '0'),
    sku: String(p.default_code || '')
  }));
}

export async function getJournalEntries() {
  const raw = await getOdooJournalEntries();
  return raw.map((entry: any) => {
    return {
      id: String(entry.id || ''),
      name: String(entry.name || ''),
      ref: String(entry.ref || ''),
      date: String(entry.date || ''),
      amountTotal: Number(entry.amount_total || 0),
      state: String(entry.state || 'draft')
    };
  });
}

export async function getMailingLists() {
  const raw = await getOdooMailingLists();
  return raw.map((list: any) => {
    return {
      id: String(list.id || ''),
      name: String(list.name || ''),
      contactCount: Number(list.contact_count || 0)
    };
  });
}

export async function createMailingList(name: string) {
  return await createOdooMailingList(name);
}

export async function getMailingContacts() {
  const raw = await getOdooMailingContacts();
  return raw.map((contact: any) => {
    let listIds: number[] = [];
    if (Array.isArray(contact.list_ids)) {
      listIds = contact.list_ids;
    } else if (typeof contact.list_ids === 'number') {
      listIds = [contact.list_ids];
    } else if (contact.list_ids) {
      listIds = [parseInt(contact.list_ids, 10)];
    }
    
    return {
      id: String(contact.id || ''),
      name: String(contact.name || 'No Name'),
      email: String(contact.email || ''),
      listIds: listIds
    };
  });
}

export async function createMailingContact(name: string, email: string, listId: number) {
  return await createOdooMailingContact(name, email, listId);
}

export async function createUtmCampaign(title: string, name: string) {
  return await createOdooUtmCampaign(title, name);
}

export async function payInvoice(invoiceId: number, amount: number, paymentDate: string, journalType: 'bank' | 'cash') {
  return await payOdooInvoice(invoiceId, amount, paymentDate, journalType);
}

export async function postInvoice(invoiceId: number) {
  return await postOdooInvoice(invoiceId);
}


