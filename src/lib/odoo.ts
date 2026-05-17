/**
 * @fileOverview Core Odoo 18 XML-RPC Client Logic.
 * Menyediakan wrapper ringan untuk memanggil External API Odoo secara standar.
 */

const ODOO_CONFIG = {
  url: 'https://www.ptrfserp.com',
  db: 'ASPK60',
  username: 'jihanamirahk1@gmail.com',
  password: 'aspk60',
};

/**
 * Membangun string XML-RPC yang valid. 
 * Semua nilai harus dibungkus dalam tag <value>.
 */
function toXmlValue(val: any): string {
  if (val === null || val === undefined) return '<value><nil/></value>';
  
  let inner = '';
  if (typeof val === 'string') {
    inner = `<string>${val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</string>`;
  } else if (typeof val === 'number') {
    inner = `<int>${Math.floor(val)}</int>`;
  } else if (typeof val === 'boolean') {
    inner = `<boolean>${val ? 1 : 0}</boolean>`;
  } else if (Array.isArray(val)) {
    inner = `<array><data>${val.map(toXmlValue).join('')}</data></array>`;
  } else if (typeof val === 'object') {
    inner = `<struct>${Object.entries(val).map(([k, v]) => `<member><name>${k}</name>${toXmlValue(v)}</member>`).join('')}</struct>`;
  }
  return `<value>${inner}</value>`;
}

async function xmlrpcCall(service: string, method: string, ...params: any[]) {
  const body = `<?xml version="1.0"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>
    ${params.map(p => `<param>${toXmlValue(p)}</param>`).join('')}
  </params>
</methodCall>`;

  // Pastikan URL tidak memiliki trailing slash ganda
  const baseUrl = ODOO_CONFIG.url.endsWith('/') ? ODOO_CONFIG.url.slice(0, -1) : ODOO_CONFIG.url;
  
  const response = await fetch(`${baseUrl}/xmlrpc/2/${service}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'text/xml',
      'Accept': 'text/xml'
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Odoo HTTP Error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (text.includes('<fault>')) {
    throw new Error(`Odoo XML-RPC Fault: ${text}`);
  }
  
  return text;
}

/**
 * Otentikasi ke Odoo untuk mendapatkan User ID (UID).
 */
export async function authenticate(): Promise<number | null> {
  try {
    const res = await xmlrpcCall('common', 'authenticate', ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {});
    const match = res.match(/<int>(\d+)<\/int>/);
    return match ? parseInt(match[1], 10) : null;
  } catch (err) {
    console.error('Odoo Authentication Failed:', err);
    return null;
  }
}

/**
 * Menjalankan metode pada model Odoo (ORM).
 */
export async function execute(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
  const uid = await authenticate();
  if (!uid) {
    throw new Error('Authentication failed. Please check your Odoo credentials.');
  }

  return await xmlrpcCall('object', 'execute_kw', ODOO_CONFIG.db, uid, ODOO_CONFIG.password, model, method, args, kwargs);
}
