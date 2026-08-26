const multer = require('multer');
const path = require('path');

// Store files directly in memory as binary Buffers for database saving in PostgreSQL BYTEA
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.xls', '.xlsx', '.csv', '.png', '.jpg', '.jpeg'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

  const originalName = file.originalname || '';
  const ext = path.extname(originalName).toLowerCase();

  // Prevent double extensions like script.php.jpg or script.exe.pdf
  const segments = originalName.split('.');
  if (segments.length > 2) {
    const forbiddenExts = ['exe', 'bat', 'cmd', 'sh', 'php', 'js', 'vbs', 'jar', 'py', 'pl'];
    const middleExts = segments.slice(1, -1).map(s => s.toLowerCase());
    if (middleExts.some(m => forbiddenExts.includes(m))) {
      return cb(new Error('Security Risk: Multi-extension files containing executable scripts are prohibited.'), false);
    }
  }

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type (${ext} / ${file.mimetype}). Only PDF, Excel, CSV, and Image files are permitted.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10
  }
});

module.exports = upload;
