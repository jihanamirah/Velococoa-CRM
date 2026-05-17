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
  updateOdooLeadDetails
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
    promoMinat: parsedPromo
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
