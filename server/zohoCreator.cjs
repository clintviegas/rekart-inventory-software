const fetch = require('node-fetch');

const {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN,
  ZOHO_ACCOUNT_OWNER,
  ZOHO_APP_NAME,
  ZOHO_DOMAIN = 'zoho.com',
} = process.env;

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const res = await fetch(`https://accounts.${ZOHO_DOMAIN}/oauth/v2/token`, {
    method: 'POST',
    body: params,
  });

  const data = await res.json();
  if (data.error) throw new Error(`Zoho Auth Error: ${data.error}`);

  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

const BASE_URL = `https://creatorapp.${ZOHO_DOMAIN}/api/v2/${ZOHO_ACCOUNT_OWNER}/${ZOHO_APP_NAME}`;

async function zohoRequest(method, path, body = null) {
  const token = await getAccessToken();
  const opts = {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    const msg = data.message || data.error || JSON.stringify(data);
    throw new Error(`Zoho API ${res.status}: ${msg}`);
  }
  return data;
}

// ─── Date conversion: HTML date inputs send YYYY-MM-DD, Zoho wants DD-MMM-YYYY
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function convertDates(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-');
      out[k] = `${d}-${MONTHS[parseInt(m, 10) - 1]}-${y}`;
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ─── CRUD helpers per form/report ───────────────────────────────
async function addRecord(formName, fieldData) {
  return zohoRequest('POST', `/form/${formName}`, { data: convertDates(fieldData) });
}

async function getRecords(reportName, criteria = '', limit = 200, offset = 1) {
  let qs = `?from=${offset}&limit=${limit}`;
  if (criteria) qs += `&criteria=${encodeURIComponent(criteria)}`;
  return zohoRequest('GET', `/report/${reportName}${qs}`);
}

async function updateRecord(reportName, recordId, fieldData) {
  return zohoRequest('PATCH', `/report/${reportName}/${recordId}`, { data: convertDates(fieldData) });
}

async function deleteRecord(reportName, recordId) {
  return zohoRequest('DELETE', `/report/${reportName}/${recordId}`);
}

module.exports = { addRecord, getRecords, updateRecord, deleteRecord, getAccessToken };
