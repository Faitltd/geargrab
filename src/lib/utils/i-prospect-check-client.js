const API_BASE = process.env.IPROSPECT_API_BASE || 'https://api.iprospectcheck.com/v1';
const API_KEY = process.env.IPROSPECT_API_KEY;
const API_CLIENT_ID = process.env.IPROSPECT_CLIENT_ID;

async function request(path, options = {}) {
  if (!API_KEY) {
    console.warn('⚠️ IPROSPECT_API_KEY is not configured. Returning placeholder data.');
    return null;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
      ...(API_CLIENT_ID ? { 'X-CLIENT-ID': API_CLIENT_ID } : {})
    },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`iProspectCheck request failed (${response.status}): ${text}`);
  }

  return response.headers.get('content-type')?.includes('application/json')
    ? response.json()
    : response.text();
}

export async function fetchReport(reportId) {
  if (!reportId) {
    throw new Error('fetchReport requires a reportId');
  }

  const data = await request(`/reports/${reportId}`).catch(() => null);

  return (
    data || {
      id: reportId,
      status: 'unknown',
      records: []
    }
  );
}

export async function getReportPdfUrl(reportId) {
  if (!reportId) {
    throw new Error('getReportPdfUrl requires a reportId');
  }

  if (!API_KEY) {
    return `https://portal.iprospectcheck.com/reports/${reportId}`;
  }

  const response = await request(`/reports/${reportId}/pdf`).catch(() => null);
  return response?.url || `https://portal.iprospectcheck.com/reports/${reportId}`;
}

export function determineAdverseAction(report) {
  const records = Array.isArray(report?.records) ? report.records : [];

  const flaggedRecords = records.filter((record) => {
    const severity = (record.severity || record.risk_level || '').toString().toLowerCase();
    const disposition = (record.disposition || record.status || '').toString().toLowerCase();
    return severity === 'high' || disposition === 'failed' || disposition === 'review';
  });

  return {
    requiresAdverseAction: flaggedRecords.length > 0,
    action: flaggedRecords.length > 0 ? 'pending_adverse_action' : 'approve',
    riskLevel: flaggedRecords.length > 0 ? 'high' : 'low',
    reasons: flaggedRecords.map((record) => record.description || record.type || 'Flagged record')
  };
}
