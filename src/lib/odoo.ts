/**
 * @fileOverview Core Odoo XML-RPC Client Logic.
 * Provides a lightweight wrapper for calling Odoo 18 External API.
 */

const ODOO_CONFIG = {
  url: 'https://www.ptrfserp.com',
  db: 'ASPK60',
  username: 'jihanamirahk1@gmail.com',
  password: 'aspk60',
};

/**
 * Basic XML-RPC string builder for Odoo calls.
 * This handles simple types: strings, ints, booleans, and arrays/structs for basic params.
 */
function toXmlValue(val: any): string {
  if (typeof val === 'string') return `<string>${val.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</string>`;
  if (typeof val === 'number') return `<int>${Math.floor(val)}</int>`;
  if (typeof val === 'boolean') return `<boolean>${val ? 1 : 0}</boolean>`;
  if (Array.isArray(val)) {
    return `<array><data>${val.map(toXmlValue).join('')}</data></array>`;
  }
  if (typeof val === 'object' && val !== null) {
    return `<struct>${Object.entries(val).map(([k, v]) => `<member><name>${k}</name><value>${toXmlValue(v)}</value></member>`).join('')}</struct>`;
  }
  return `<nil/>`;
}

async function xmlrpcCall(service: string, method: string, ...params: any[]) {
  const body = `<?xml version="1.0"?>
    <methodCall>
      <methodName>${method}</methodName>
      <params>
        ${params.map(p => `<param><value>${toXmlValue(p)}</value></param>`).join('')}
      </params>
    </methodCall>`;

  const response = await fetch(`${ODOO_CONFIG.url}/xmlrpc/2/${service}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body,
  });

  if (!response.ok) {
    throw new Error(`Odoo API Error: ${response.statusText}`);
  }

  const text = await response.text();
  // Simple regex-based parsing for prototype (usually a library like xmlrpc is used)
  // We'll focus on extracting common return types for this implementation.
  return text;
}

/**
 * Authenticate with Odoo and return UID.
 */
export async function authenticate(): Promise<number | null> {
  try {
    const res = await xmlrpcCall('common', 'authenticate', ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {});
    const match = res.match(/<int>(\d+)<\/int>/);
    return match ? parseInt(match[1], 10) : null;
  } catch (err) {
    console.error('Odoo Auth Error:', err);
    return null;
  }
}

/**
 * Execute a method on an Odoo model (ORM).
 */
export async function execute(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
  const uid = await authenticate();
  if (!uid) throw new Error('Authentication failed');

  // Logic for Odoo's execute_kw
  // Standard params: db, uid, password, model, method, args, kwargs
  const body = `<?xml version="1.0"?>
    <methodCall>
      <methodName>execute_kw</methodName>
      <params>
        <param><value><string>${ODOO_CONFIG.db}</string></value></param>
        <param><value><int>${uid}</int></value></param>
        <param><value><string>${ODOO_CONFIG.password}</string></value></param>
        <param><value><string>${model}</string></value></param>
        <param><value><string>${method}</string></value></param>
        <param><value>${toXmlValue(args)}</value></param>
        <param><value>${toXmlValue(kwargs)}</value></param>
      </params>
    </methodCall>`;

  const response = await fetch(`${ODOO_CONFIG.url}/xmlrpc/2/object`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body,
  });

  const text = await response.text();
  
  // Basic parsing of the return structure
  if (text.includes('faultCode')) throw new Error('Odoo Server Fault: ' + text);

  return text; 
}
