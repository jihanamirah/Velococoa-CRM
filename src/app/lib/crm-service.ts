import { aiLeadSegmentationAndPrioritization } from '@/ai/flows/ai-lead-segmentation-and-prioritization-flow';

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

// Simulated persistence using local storage or memory for prototype
let leads: Lead[] = [
  {
    id: '1',
    namaLengkap: 'Budi Santoso',
    namaPerusahaan: 'Kopi Kenangan Senja',
    email: 'budi@kopisenja.com',
    telepon: '08123456789',
    kota: 'Jakarta',
    kategoriBisnis: 'Kafe & Kedai Kopi',
    promoMinat: 'Diskon Biji Coklat 20%',
    estimasiVolume: '50kg / month',
    catatan: 'Tertarik untuk supply tetap.',
    catatanInternal: '',
    status: 'Baru',
    sumber: 'Website',
    sudahSyncOdoo: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    namaLengkap: 'Ani Wijaya',
    namaPerusahaan: 'Sweet Bakery',
    email: 'ani@sweetbakery.id',
    telepon: '082233445566',
    kota: 'Bandung',
    kategoriBisnis: 'Bakery & Pastry',
    promoMinat: 'Free Sample Pack',
    estimasiVolume: '20kg / week',
    catatan: 'Mencoba coklat coating baru.',
    catatanInternal: 'Customer lama, ingin ganti supplier.',
    status: 'Dihubungi',
    sumber: 'Email Marketing',
    sudahSyncOdoo: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '3',
    namaLengkap: 'James Bond',
    namaPerusahaan: 'Grand Aston Hotel',
    email: 'procurement@grandaston.com',
    telepon: '0811223344',
    kota: 'Bali',
    kategoriBisnis: 'Hotel & Korporasi',
    promoMinat: 'Corporate Rates',
    estimasiVolume: '200kg / month',
    catatan: 'Butuh coklat premium untuk dessert buffet.',
    catatanInternal: '',
    status: 'Qualified',
    sumber: 'Langsung',
    sudahSyncOdoo: true,
    odooLeadId: 'CRM-9921',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  }
];

export async function getLeads(): Promise<Lead[]> {
  return leads;
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  return leads.find(l => l.id === id);
}

export async function createLead(input: Partial<Lead>): Promise<Lead> {
  const newLead: Lead = {
    id: Math.random().toString(36).substr(2, 9),
    namaLengkap: input.namaLengkap || '',
    namaPerusahaan: input.namaPerusahaan || '',
    email: input.email || '',
    telepon: input.telepon || '',
    kota: input.kota || '',
    kategoriBisnis: input.kategoriBisnis || 'Lainnya',
    promoMinat: input.promoMinat || '',
    estimasiVolume: input.estimasiVolume || '',
    catatan: input.catatan || '',
    catatanInternal: '',
    status: 'Baru',
    sumber: input.sumber || 'Langsung',
    sudahSyncOdoo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input
  };

  // Run AI analysis
  try {
    const aiResult = await aiLeadSegmentationAndPrioritization({
      namaLengkap: newLead.namaLengkap,
      namaPerusahaan: newLead.namaPerusahaan,
      email: newLead.email,
      telepon: newLead.telepon,
      kota: newLead.kota,
      kategoriBisnis: newLead.kategoriBisnis,
      promoMinat: newLead.promoMinat,
      estimasiVolume: newLead.estimasiVolume,
      catatan: newLead.catatan,
    });
    
    newLead.aiSuggestedSegment = aiResult.suggestedBusinessSegment;
    newLead.aiFollowUpPriority = aiResult.followUpPriority;
    newLead.aiReasoning = aiResult.reasoning;
  } catch (err) {
    console.error('AI Analysis failed:', err);
  }

  leads = [newLead, ...leads];
  return newLead;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead | undefined> {
  const leadIndex = leads.findIndex(l => l.id === id);
  if (leadIndex === -1) return undefined;

  leads[leadIndex] = {
    ...leads[leadIndex],
    status,
    updatedAt: new Date().toISOString()
  };
  return leads[leadIndex];
}