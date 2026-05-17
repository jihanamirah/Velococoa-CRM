import { aiLeadSegmentationAndPrioritization } from '@/ai/flows/ai-lead-segmentation-and-prioritization-flow';
import { getOdooLeads, createOdooLead, updateOdooLeadStage } from '@/services/odoo';

export type LeadStatus = 'Baru' | 'Dihubungi' | 'Qualified' | 'Won' | 'Lost';
export type LeadSource = 'Email Marketing' | 'Website' | 'Langsung';

export interface Lead {
  id: string;
  namaLengkap: string;
  namaPerusahaan: string;
  email: string;
  telepon: string;
  kota: string;
  kategoriBisnis: string;
  promoMinat: string;
  estimasiVolume: string;
  catatan: string;
  catatanInternal: string;
  status: LeadStatus;
  sumber: LeadSource;
  sudahSyncOdoo: boolean;
  odooLeadId?: string;
  aiSuggestedSegment?: string;
  aiFollowUpPriority?: string;
  aiReasoning?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mapping data Odoo crm.lead ke interface Lead lokal aplikasi.
 */
function mapOdooToLead(odoo: any): Lead {
  let status: LeadStatus = 'Baru';
  
  if (odoo.stage_id) {
    const stage = String(odoo.stage_id).toLowerCase();
    if (stage.includes('new') || stage.includes('baru')) status = 'Baru';
    else if (stage.includes('qualified')) status = 'Qualified';
    else if (stage.includes('won') || stage.includes('berhasil')) status = 'Won';
    else if (stage.includes('lost') || stage.includes('gagal')) status = 'Lost';
    else if (stage.includes('prop') || stage.includes('hubungi') || stage.includes('contact')) status = 'Dihubungi';
  }

  return {
    id: String(odoo.id),
    namaLengkap: odoo.contact_name || 'Tanpa Nama',
    namaPerusahaan: odoo.name || 'Untitled Opportunity',
    email: odoo.email_from || '',
    telepon: odoo.phone || '',
    kota: odoo.city || '',
    kategoriBisnis: odoo.description?.match(/AI Suggested Segment: (.*?)\n/)?.[1] || 'Lainnya',
    promoMinat: '',
    estimasiVolume: '',
    catatan: odoo.description || '',
    catatanInternal: '',
    status: status,
    sumber: 'Langsung',
    sudahSyncOdoo: true,
    odooLeadId: String(odoo.id),
    aiFollowUpPriority: odoo.priority === '3' ? 'High' : odoo.priority === '2' ? 'Medium' : 'Low',
    aiReasoning: odoo.description?.match(/Reasoning: (.*?)\n/)?.[1] || '',
    createdAt: odoo.create_date || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getLeads(): Promise<Lead[]> {
  const odooLeads = await getOdooLeads();
  return odooLeads.map(mapOdooToLead);
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  const all = await getLeads();
  return all.find(l => l.id === id);
}

export async function createLead(input: Partial<Lead>): Promise<Lead> {
  const newLead: Partial<Lead> = {
    ...input,
    status: 'Baru',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const aiResult = await aiLeadSegmentationAndPrioritization({
      namaLengkap: input.namaLengkap || '',
      namaPerusahaan: input.namaPerusahaan || '',
      email: input.email || '',
      telepon: input.telepon || '',
      kota: input.kota || '',
      kategoriBisnis: input.kategoriBisnis || '',
      promoMinat: input.promoMinat || '',
      estimasiVolume: input.estimasiVolume || '',
      catatan: input.catatan || '',
    });
    
    newLead.aiSuggestedSegment = aiResult.suggestedBusinessSegment;
    newLead.aiFollowUpPriority = aiResult.followUpPriority;
    newLead.aiReasoning = aiResult.reasoning;
  } catch (err) {
    console.error('AI Analysis failed:', err);
  }

  const odooRes = await createOdooLead(newLead);
  if (odooRes.success) {
    newLead.id = odooRes.id;
    newLead.odooLeadId = odooRes.id;
    newLead.sudahSyncOdoo = true;
  }

  return newLead as Lead;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead | undefined> {
  const result = await updateOdooLeadStage(parseInt(id, 10), status);
  if (result.success) {
    return getLeadById(id);
  }
  return undefined;
}
