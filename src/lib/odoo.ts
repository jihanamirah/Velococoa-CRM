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
  let inner = '';
  if (typeof val === 'string') {
    inner = `<string>${val.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</string>`;
  } else if (typeof val === 'number') {
    inner = `<int>${Math.floor(val)}</int>`;
  } else if (typeof val === 'boolean') {
    inner = `<boolean>${val ? 1 : 0}</boolean>`;
  } else if (Array.isArray(val)) {
    inner = `<array><data>${val.map(toXmlValue).join('')}</data></array>`;
  } else if (typeof val === 'object' && val !== null) {
    inner = `<struct>${Object.entries(val).map(([k, v]) => `<member><name>${k}</name>${toXmlValue(v)}</member>`).join('')}</struct>`;
  } else {
    inner = `<nil/>`;
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

  const response = await fetch(`${ODOO_CONFIG.url}/xmlrpc/2/${service}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body,
  });

  if (!response.ok) {
    throw new Error(`Odoo API Error: ${response.statusText}`);
  }

  return await response.text();
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
    console.error('Odoo Auth Error:', err);
    return null;
  }
}

/**
 * Menjalankan metode pada model Odoo (ORM).
 */
export async function execute(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
  const uid = await authenticate();
  if (!uid) throw new Error('Otentikasi Odoo gagal. Periksa username/password.');

  return await xmlrpcCall('object', 'execute_kw', ODOO_CONFIG.db, uid, ODOO_CONFIG.password, model, method, args, kwargs);
}
