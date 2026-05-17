
import { aiLeadSegmentationAndPrioritization } from '@/ai/flows/ai-lead-segmentation-and-prioritization-flow';
import { 
  getOdooLeads, 
  getOdooStages, 
  getOdooLeadById,
  createOdooLead, 
  updateOdooLeadStage, 
  setOdooLeadWon, 
  setOdooLeadLost 
} from '@/services/odoo';

export interface OdooStage {
  id: number;
  name: string;
  sequence: number;
}

export type LeadStatus = 'Baru' | 'Dihubungi' | 'Qualified' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  namaLengkap: string;
  namaPerusahaan: string;
  email: string;
  telepon: string;
  kota: string;
  kategoriBisnis: string;
  status: string; // Map to stage name
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
}

/**
 * Mapping data Odoo crm.lead ke interface Lead lokal aplikasi.
 */
function mapOdooToLead(odoo: any): Lead {
  const description = typeof odoo.description === 'string' ? odoo.description : '';
  const stageData = Array.isArray(odoo.stage_id) ? odoo.stage_id : [0, 'Unknown'];

  return {
    id: String(odoo.id),
    namaLengkap: (typeof odoo.contact_name === 'string' ? odoo.contact_name : '') || 'Tanpa Nama',
    namaPerusahaan: (typeof odoo.name === 'string' ? odoo.name : '') || 'Untitled Opportunity',
    email: (typeof odoo.email_from === 'string' ? odoo.email_from : '') || '',
    telepon: (typeof odoo.phone === 'string' ? odoo.phone : '') || '',
    kota: (typeof odoo.city === 'string' ? odoo.city : '') || '',
    kategoriBisnis: description.match(/AI Suggested Segment: (.*?)\n/)?.[1] || 'Lainnya',
    status: stageData[1],
    stageId: stageData[0],
    probability: typeof odoo.probability === 'number' ? odoo.probability : 0,
    active: odoo.active !== false,
    sudahSyncOdoo: true,
    odooLeadId: String(odoo.id),
    aiSuggestedSegment: description.match(/AI Suggested Segment: (.*?)\n/)?.[1] || 'Lainnya',
    aiFollowUpPriority: odoo.priority === '3' ? 'High' : odoo.priority === '2' ? 'Medium' : 'Low',
    aiReasoning: description.match(/Reasoning: (.*?)\n/)?.[1] || '',
    catatan: description.match(/Notes: ([\s\S]*)/)?.[1] || description,
    catatanInternal: '',
    sumber: 'Odoo CRM',
    createdAt: (typeof odoo.create_date === 'string' ? odoo.create_date : '') || new Date().toISOString(),
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
  return await setOdooLeadWon(parseInt(leadId, 10));
}

export async function markLost(leadId: string) {
  return await setOdooLeadLost(parseInt(leadId, 10));
}

export async function updateLeadStatus(leadId: string, newStatus: LeadStatus): Promise<Lead | null> {
  const id = parseInt(leadId, 10);
  let success = false;
  
  if (newStatus === 'Won') {
    const res = await setOdooLeadWon(id);
    success = res.success;
  } else if (newStatus === 'Lost') {
    const res = await setOdooLeadLost(id);
    success = res.success;
  } else {
    const stages = await getStages();
    // Cari stage yang namanya mirip dengan status target (Baru, Dihubungi, Qualified)
    const targetStage = stages.find(s => s.name.toLowerCase().includes(newStatus.toLowerCase()));
    if (targetStage) {
      const res = await updateOdooLeadStage(id, targetStage.id);
      success = res.success;
    }
  }

  if (success) {
    return await getLeadById(leadId);
  }
  return null;
}

export async function createLead(input: any): Promise<any> {
  let aiResult = { suggestedBusinessSegment: 'Lainnya', followUpPriority: 'Low', reasoning: '' };
  try {
    aiResult = await aiLeadSegmentationAndPrioritization(input);
  } catch (err) {
    console.error('AI Analysis failed:', err);
  }

  return await createOdooLead({
    ...input,
    aiSuggestedSegment: aiResult.suggestedBusinessSegment,
    aiFollowUpPriority: aiResult.followUpPriority,
    aiReasoning: aiResult.reasoning
  });
}
