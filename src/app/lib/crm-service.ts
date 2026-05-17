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
}

function mapOdooToLead(odoo: any): Lead {
  const description = String(odoo.description || '');
  const stageData = Array.isArray(odoo.stage_id) ? odoo.stage_id : [0, 'Unassigned'];

  return {
    id: String(odoo.id),
    namaLengkap: String(odoo.contact_name || 'Tanpa Nama'),
    namaPerusahaan: String(odoo.name || 'Opportunity'),
    email: String(odoo.email_from || ''),
    telepon: String(odoo.phone || ''),
    kota: String(odoo.city || ''),
    kategoriBisnis: description.match(/AI Suggested Segment: (.*?)\n/)?.[1] || 'Lainnya',
    status: stageData[1],
    stageId: stageData[0],
    probability: Number(odoo.probability || 0),
    active: odoo.active !== false,
    sudahSyncOdoo: true,
    odooLeadId: String(odoo.id),
    aiSuggestedSegment: description.match(/AI Suggested Segment: (.*?)\n/)?.[1] || 'Lainnya',
    aiFollowUpPriority: odoo.priority === '3' ? 'High' : odoo.priority === '2' ? 'Medium' : 'Low',
    aiReasoning: description.match(/Reasoning: (.*?)\n/)?.[1] || '',
    catatan: description,
    catatanInternal: '',
    sumber: 'Odoo CRM',
    createdAt: String(odoo.create_date || new Date().toISOString()),
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
    const target = stages.find(s => s.name.toLowerCase().includes(newStatus.toLowerCase()));
    if (target) {
      const res = await updateOdooLeadStage(idInt, target.id);
      success = res.success;
    }
  }

  if (success) return await getLeadById(leadId);
  return null;
}

export async function createLead(input: any): Promise<any> {
  return await createOdooLead(input);
}
