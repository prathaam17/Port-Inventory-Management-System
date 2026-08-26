const path = require('path');
const { FileStore } = require('../models');

/**
 * Saves an uploaded file buffer directly into PostgreSQL BYTEA column.
 * @param {Object} file - Multer memory storage file object
 * @param {string} category - Document category label
 * @returns {Promise<string|null>} Generated unique filename stored in DB
 */
async function saveFileToPostgres(file, category = 'general') {
  if (!file || !file.buffer) return null;

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const originalExt = path.extname(file.originalname || '').toLowerCase();
  const safeExt = originalExt.replace(/[^a-z0-9.]/g, '');
  const safeFieldName = (file.fieldname || 'doc').replace(/[^a-zA-Z0-9_]/g, '');
  const filename = `${safeFieldName || 'doc'}-${uniqueSuffix}${safeExt || '.pdf'}`;

  const record = await FileStore.create({
    filename,
    originalname: file.originalname || filename,
    mimetype: file.mimetype || 'application/octet-stream',
    size: file.size || file.buffer.length,
    data: file.buffer, // Binary Buffer stored directly in PostgreSQL BYTEA
    category
  });

  return record.filename;
}

module.exports = {
  saveFileToPostgres
};
