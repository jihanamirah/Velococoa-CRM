import { getLeadById } from './src/app/lib/crm-service';

async function run() {
  console.log('Fetching Lead ID 43 directly from Odoo ERP...');
  try {
    const lead = await getLeadById('43');
    if (lead) {
      console.log('Live Lead Data in Odoo:');
      console.log({
        id: lead.id,
        namaPerusahaan: lead.namaPerusahaan,
        namaLengkap: lead.namaLengkap,
        status: lead.status,
        stageId: lead.stageId,
        telepon: lead.telepon,
        kota: lead.kota
      });
    } else {
      console.log('Lead ID 43 not found in Odoo.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
