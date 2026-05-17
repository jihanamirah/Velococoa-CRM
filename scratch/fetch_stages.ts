import { getOdooStages, getOdooLeads } from '../src/services/odoo';

async function run() {
  console.log("Fetching stages from Odoo ERP...");
  const stages = await getOdooStages();
  console.log("Stages in Odoo ERP:", JSON.stringify(stages, null, 2));

  console.log("\nFetching all leads from Odoo ERP...");
  const leads = await getOdooLeads();
  console.log("Leads in Odoo ERP (sample 5):", JSON.stringify(leads.slice(0, 5), null, 2));
}

run();
