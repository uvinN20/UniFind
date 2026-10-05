const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../config/paths');

exports.fileUrl = (file) => (file ? `/uploads/${file.filename}` : '');

// Best-effort delete of a stored photo (errors are ignored on purpose)
exports.removeUploadedFile = (imageUrl) => {
  if (!imageUrl) return;
  fs.unlink(path.join(UPLOAD_DIR, path.basename(imageUrl)), () => {});
};
