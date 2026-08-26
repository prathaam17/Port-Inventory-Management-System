const http = require('http');
require('dotenv').config();

const PYTHON_PIMS_URL = process.env.PYTHON_PIMS_URL || 'http://127.0.0.1:8000';

// Helper to send HTTP requests to FastAPI microservice
const proxyToFastAPI = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${PYTHON_PIMS_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            resolve({ status: res.statusCode, data: parsed, error: true });
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Python PIMS microservice connection timed out.'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

// GET /api/python-ledger/health
exports.getPimsHealth = async (req, res) => {
  try {
    const result = await proxyToFastAPI('/yard/capacity', 'GET');
    return res.json({
      status: 'online',
      microservice: 'Python FastAPI PIMS Ledger (Port 8000)',
      yardCapacity: result.data
    });
  } catch (error) {
    return res.status(503).json({
      status: 'offline',
      message: 'Python FastAPI microservice is offline or unreachable on port 8000.',
      error: error.message
    });
  }
};

// POST /api/python-ledger/demurrage-check
exports.triggerDemurrageCheck = async (req, res) => {
  try {
    const result = await proxyToFastAPI('/demurrage/check', 'POST');
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to communicate with Python PIMS ledger microservice.', error: error.message });
  }
};

// POST /api/python-ledger/discharge-tally/:vcn
exports.dischargeTally = async (req, res) => {
  const { vcn } = req.params;
  try {
    const result = await proxyToFastAPI(`/discharge/tally/${vcn}`, 'POST', req.body);
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to log discharge tally in Python PIMS microservice.', error: error.message });
  }
};

// POST /api/python-ledger/gate-evacuate
exports.gateEvacuation = async (req, res) => {
  try {
    const result = await proxyToFastAPI('/gate/evacuate', 'POST', req.body);
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process gate evacuation in Python PIMS microservice.', error: error.message });
  }
};

// GET /api/python-ledger/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const result = await proxyToFastAPI('/audit-logs', 'GET');
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve audit logs from Python PIMS microservice.', error: error.message });
  }
};
