import { getStages } from './src/app/lib/crm-service';

async function run() {
  console.log('Fetching all stages from Odoo ERP...');
  try {
    const stages = await getStages();
    console.log('Stages Configured in Odoo:');
    console.log(stages);
  } catch (error) {
    console.error('Error fetching stages:', error);
  }
}

run();
