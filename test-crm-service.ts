import { getLeads } from './src/app/lib/crm-service';

async function run() {
  console.log('Testing the fully integrated CRM service after our fixes...');
  try {
    const leads = await getLeads();
    console.log(`Total Leads: ${leads.length}`);
    const assignedLeads = leads.filter(l => l.stageId > 0);
    console.log(`Leads with assigned stageId > 0: ${assignedLeads.length}`);
    
    if (leads.length > 0) {
      console.log('\nSample Leads from Odoo:');
      console.log(leads.slice(0, 3).map(l => ({
        id: l.id,
        namaLengkap: l.namaLengkap,
        namaPerusahaan: l.namaPerusahaan,
        status: l.status,
        stageId: l.stageId,
        sumber: l.sumber
      })));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
