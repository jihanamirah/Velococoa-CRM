import { getLeadById, updateLeadDetails } from './src/app/lib/crm-service';

async function run() {
  console.log('Fetching Lead ID 63 from Odoo...');
  const leadBefore = await getLeadById('63');
  if (!leadBefore) {
    console.error('Lead not found!');
    return;
  }
  console.log('Lead before update:', {
    namaPerusahaan: leadBefore.namaPerusahaan,
    telepon: leadBefore.telepon,
    kota: leadBefore.kota
  });

  const uniquePhone = '0812' + Math.floor(10000000 + Math.random() * 90000000);
  console.log(`\nAttempting to update phone to: ${uniquePhone}...`);
  
  const updatedLead = await updateLeadDetails('63', {
    telepon: uniquePhone,
    kota: 'Bandung'
  });

  if (updatedLead) {
    console.log('Update function returned success! Fetching fresh data from Odoo to verify persistence...');
    const leadAfter = await getLeadById('63');
    if (leadAfter) {
      console.log('Lead after update in Odoo:', {
        namaPerusahaan: leadAfter.namaPerusahaan,
        telepon: leadAfter.telepon,
        kota: leadAfter.kota
      });
      if (leadAfter.telepon === uniquePhone) {
        console.log('SUCCESS: Odoo successfully wrote and persisted the data!');
      } else {
        console.error('ERROR: Odoo did not persist the updated data.');
      }
    }
  } else {
    console.error('Update operation returned failure.');
  }
}

run();
